---
name: Zod v3 + Orval v8 codegen fix
description: Orval 8.x emits zod.int() which is Zod v4 API and breaks Zod v3 projects; fix via post-process sed in the codegen script.
---

## The rule
After running `orval`, pipe the generated file through sed to replace `zod.int()` with `zod.number().int()`.

**Why:** Orval 8.23+ generates `zod.int()` for `type: integer` fields. `zod.int()` only exists in Zod v4. If the project uses Zod v3 (import path `"zod"` or `"zod/v3"`), all 66+ generated calls fail with "zod.int is not a function" at runtime.

**How to apply:** In `lib/api-spec/package.json`, the codegen script should be:
```
orval --config ./orval.config.ts && sed -i 's/zod\.int()/zod.number().int()/g' ../../lib/api-zod/src/generated/api.ts && pnpm -w run typecheck:libs
```
Adjust the path to the generated file as needed. The sed runs in-place after Orval writes its output.
