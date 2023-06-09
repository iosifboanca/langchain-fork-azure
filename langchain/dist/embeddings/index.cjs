"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeEmbeddings = exports.Embeddings = exports.CohereEmbeddings = exports.OpenAIEmbeddings = void 0;
/* #__PURE__ */
console.error("[WARN] Importing from 'langchain/embeddings' is deprecated. Import from eg. 'langchain/embeddings/openai' instead. See https://js.langchain.com/docs/getting-started/install#updating-from-0052 for upgrade instructions.");
var openai_js_1 = require("./openai.cjs");
Object.defineProperty(exports, "OpenAIEmbeddings", { enumerable: true, get: function () { return openai_js_1.OpenAIEmbeddings; } });
var cohere_js_1 = require("./cohere.cjs");
Object.defineProperty(exports, "CohereEmbeddings", { enumerable: true, get: function () { return cohere_js_1.CohereEmbeddings; } });
var base_js_1 = require("./base.cjs");
Object.defineProperty(exports, "Embeddings", { enumerable: true, get: function () { return base_js_1.Embeddings; } });
var fake_js_1 = require("./fake.cjs");
Object.defineProperty(exports, "FakeEmbeddings", { enumerable: true, get: function () { return fake_js_1.FakeEmbeddings; } });
