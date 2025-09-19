import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '..', 'index.js');

describe('WhatsApp MCP Server', () => {
  let serverProcess;

  const sendRequest = (request) => {
    return new Promise((resolve, reject) => {
      serverProcess = spawn('node', [serverPath]);
      let output = '';
      let errorOutput = '';

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      serverProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        } else {
          try {
            const lines = output.split('\n').filter(line => line.trim());
            const jsonLine = lines.find(line => line.startsWith('{'));
            resolve(JSON.parse(jsonLine));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        }
      });

      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      serverProcess.stdin.end();
    });
  };

  afterEach(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Tools List', () => {
    it('should return available tools', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };

      const response = await sendRequest(request);

      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('tools');
      expect(response.result.tools).toHaveLength(1);
      expect(response.result.tools[0]).toEqual({
        name: 'send_whatsapp_message',
        description: 'Envia mensagem para WhatsApp',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem a ser enviada'
            }
          },
          required: ['message']
        }
      });
    });
  });

  describe('Send WhatsApp Message', () => {
    it('should send message successfully', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'send_whatsapp_message',
          arguments: {
            message: 'Test message'
          }
        }
      };

      const response = await sendRequest(request);

      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
      expect(response.result.content).toHaveLength(1);
      expect(response.result.content[0]).toHaveProperty('type', 'text');
      expect(response.result.content[0].text).toContain('✅ Mensagem enviada com sucesso!');
      expect(response.result.content[0].text).toContain('ID: msg_');
      expect(response.result.content[0].text).toContain('Para: Grupo Principal');
      expect(response.result.content[0].text).toContain('Status: sent');
    });

    it('should handle empty message', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'send_whatsapp_message',
          arguments: {
            message: ''
          }
        }
      };

      const response = await sendRequest(request);

      expect(response).toHaveProperty('result');
      expect(response.result.content[0].text).toContain('✅ Mensagem enviada com sucesso!');
    });

    it('should handle unknown tool', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      const response = await sendRequest(request);

      expect(response).toHaveProperty('error');
      expect(response.error.message).toContain('Ferramenta desconhecida: unknown_tool');
    });
  });

  describe('Message Format Validation', () => {
    it('should generate valid message ID', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'send_whatsapp_message',
          arguments: {
            message: 'Test'
          }
        }
      };

      const response = await sendRequest(request);
      const text = response.result.content[0].text;
      const idMatch = text.match(/ID: (msg_\d+)/);
      
      expect(idMatch).toBeTruthy();
      expect(idMatch[1]).toMatch(/^msg_\d+$/);
    });

    it('should generate valid timestamp', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'send_whatsapp_message',
          arguments: {
            message: 'Test'
          }
        }
      };

      const response = await sendRequest(request);
      const text = response.result.content[0].text;
      const timestampMatch = text.match(/Enviado em: (.+)/);
      
      expect(timestampMatch).toBeTruthy();
      expect(() => new Date(timestampMatch[1])).not.toThrow();
    });
  });
});
