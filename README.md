# Servidor MCP WhatsApp

Servidor MCP para envio de mensagens WhatsApp com resultados mockados.

## Configuração

1. Instalar dependências:
```bash
npm install
```

2. Configurar no Q CLI:
```bash
q config set mcp-servers-config-path /home/participant/projeto-diego/mcp-config.json
```

3. Reiniciar Q CLI para carregar o servidor MCP

## Uso

No Q CLI, use a ferramenta:
```
whatsapp___send_whatsapp_message
```

Parâmetros:
- `message`: Mensagem a ser enviada

## Exemplo

```
Envie a mensagem "Olá mundo!" para WhatsApp
```
