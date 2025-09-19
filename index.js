#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "whatsapp-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Mock da API do WhatsApp
async function sendWhatsAppMessage(message) {
  // Simula delay da API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    messageId: `msg_${Date.now()}`,
    status: "sent",
    timestamp: new Date().toISOString(),
    group: "Grupo Principal"
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_whatsapp_message",
        description: "Envia mensagem para WhatsApp",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Mensagem a ser enviada"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "send_whatsapp_message") {
    try {
      const result = await sendWhatsAppMessage(args.message);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Mensagem enviada com sucesso!\n\nDetalhes:\n- ID: ${result.messageId}\n- Para: ${result.group}\n- Status: ${result.status}\n- Enviado em: ${result.timestamp}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Erro ao enviar mensagem: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main()
.then(() => {
  console.log("Conexão estabelecida com sucesso!");
})
.catch(console.error);
