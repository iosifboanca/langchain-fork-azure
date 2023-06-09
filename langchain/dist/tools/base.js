import { z } from "zod";
import { CallbackManager, } from "../callbacks/manager.js";
import { BaseLangChain } from "../base_language/index.js";
export class StructuredTool extends BaseLangChain {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "returnDirect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    async call(arg, callbacks) {
        const parsed = await this.schema.parseAsync(arg);
        const callbackManager_ = await CallbackManager.configure(callbacks, this.callbacks, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleToolStart({ name: this.name }, typeof parsed === "string" ? parsed : JSON.stringify(parsed));
        let result;
        try {
            result = await this._call(parsed, runManager);
        }
        catch (e) {
            await runManager?.handleToolError(e);
            throw e;
        }
        await runManager?.handleToolEnd(result);
        return result;
    }
}
export class Tool extends StructuredTool {
    constructor(verbose, callbacks) {
        super({ verbose, callbacks });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z
                .object({ input: z.string().optional() })
                .transform((obj) => obj.input)
        });
    }
    call(arg, callbacks) {
        return super.call(typeof arg === "string" || !arg ? { input: arg } : arg, callbacks);
    }
}
