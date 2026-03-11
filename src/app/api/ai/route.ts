import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

const SYSTEM_PROMPT = `Você é um especialista em computação quântica com foco em Qiskit (IBM). Seu trabalho é:

1. Analisar operações/scripts que o usuário enviar e determinar se podem ser otimizados com computação quântica
2. Quando possível, gerar tanto a versão clássica (Python puro) quanto a versão quântica (Qiskit)
3. Explicar de forma clara e educativa POR QUE a versão quântica é (ou não é) vantajosa
4. Ser honesto quando computação quântica NÃO oferece vantagem (ex: tarefas sequenciais simples, I/O bound)

Regras:
- Sempre responda em português (pt-BR)
- Scripts Python devem ser completos e executáveis
- Use Qiskit 1.x com qiskit_aer para simulação
- Formate código em blocos \`\`\`python
- Inclua complexidade (Big-O) quando relevante
- Seja direto mas educativo`;

const MOCK_RESPONSE = `🔧 **API Key não configurada**

Para usar o Playground Quântico com IA, configure a variável de ambiente \`OPENAI_API_KEY\` no seu projeto:

\`\`\`bash
# .env.local
OPENAI_API_KEY=sk-...
\`\`\`

Depois reinicie o servidor de desenvolvimento.

Enquanto isso, explore as **comparações na página inicial** — elas mostram exemplos completos de algoritmos clássicos vs quânticos lado a lado!`;

export async function POST(request: NextRequest) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages array is required and must not be empty' },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // ─── Mock response when no API key ────────────────────────────────
  if (!apiKey) {
    return NextResponse.json(
      { content: MOCK_RESPONSE },
      { status: 200 },
    );
  }

  // ─── Call OpenAI API with streaming ───────────────────────────────
  const openAiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ];

  const openAiResponse = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openAiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    },
  );

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    console.error('OpenAI API error:', openAiResponse.status, errorText);
    return NextResponse.json(
      { error: `OpenAI API error: ${openAiResponse.status}` },
      { status: 502 },
    );
  }

  // ─── Stream the response back ─────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openAiResponse.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: { content?: string };
                }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content })}\n\n`,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        console.error('Stream reading error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
