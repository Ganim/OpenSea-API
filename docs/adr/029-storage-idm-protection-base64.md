# ADR 029 — Storage: Preview de arquivo via POST + base64 em JSON (bypass IDM)

**Status:** Accepted
**Date:** 2026-04-17 (promovido da memória de 2026-03-31)

## Contexto

Download managers (Internet Download Manager, JDownloader, etc.) interceptam **qualquer** resposta HTTP cujo `Content-Type` indique arquivo binário (PDF, imagem, doc), independente do método HTTP (GET, POST, XHR, fetch) ou dos headers custom enviados pelo frontend.

Isso quebra o fluxo de preview inline do File Manager — o usuário clica pra pré-visualizar um PDF dentro do app, o IDM sequestra a resposta e transforma em download, o preview nunca abre.

## Decisão

O endpoint de preview de arquivo retorna os bytes **codificados em base64 dentro de um JSON**. O `Content-Type` da resposta é `application/json`, e o IDM não intercepta JSON.

### Endpoint

```
POST /v1/storage/preview
Body: { fileId, format?, password? }
Response: { data: base64, mimeType, fileName, size }
```

### Frontend — decodificação

```js
const json = await res.json();
const binary = atob(json.data);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
// Use bytes.buffer como ArrayBuffer para PdfViewer, ou new Blob([bytes]) para images
```

## Consequências

- Todo fluxo de preview/display in-app usa este endpoint — **nunca** a URL direta `/serve` no DOM.
- Overhead ~33% no payload (base64 encoding), aceitável para preview (não para download de arquivo grande).
- O endpoint `/serve` continua disponível para download explícito (usuário opta por baixar).

## Alternativas consideradas

- **GET com `Content-Disposition: inline`**: interceptado pelo IDM.
- **POST com resposta binária** (ArrayBuffer): interceptado.
- **XHR com `responseType: arraybuffer`**: interceptado.
- **Headers custom X-No-Download**: IDM ignora headers custom.

Apenas resposta `application/json` passou em todos os testes com IDM ativo.
