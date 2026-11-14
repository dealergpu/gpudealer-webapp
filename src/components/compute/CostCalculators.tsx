'use client';

import { useId, useState, type ReactNode } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComputePricingUnit } from "@/lib/api";
import { formatFixedMoney, formatMoney, multiplyFixed, toFixedPoint } from "@/lib/compute";

const CUSTOM = "custom";
const HOURS_24_7 = "730"; // average hours in a month

export type GpuPriceOption = {
  id: string;
  label: string;
  amount: string;
  currency: string;
  unit: typeof ComputePricingUnit.GPU_HOUR | typeof ComputePricingUnit.INSTANCE_HOUR;
  gpuCount: number | null;
};

export type InferencePriceOption = {
  id: string;
  label: string;
  inputAmount: string;
  outputAmount: string;
  currency: string;
};

function CalculatorShell({ title, children, result, assumptions }: { title: string; children: ReactNode; result: ReactNode; assumptions: string }) {
  return (
    <section aria-label={title} className="rounded-3xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="h-4 w-4 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      <div className="mt-5 grid gap-4">{children}</div>
      <div className="mt-6 border-t border-border pt-4" aria-live="polite">
        <p className="text-xs text-muted-foreground">Estimated monthly cost</p>
        <p className="mt-1 font-mono text-3xl tabular-nums">{result}</p>
        <p className="mt-2 text-xs text-muted-foreground">{assumptions}</p>
      </div>
    </section>
  );
}

function PriceSelect<T extends { id: string; label: string }>({
  id,
  options,
  value,
  onChange,
  describe,
}: {
  id: string;
  options: T[];
  value: string;
  onChange: (value: string) => void;
  describe: (option: T) => string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Price</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label} — {describe(option)}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Enter a price</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberField({ id, label, value, onChange, hint, step = "1" }: { id: string; label: string; value: string; onChange: (value: string) => void; hint?: string; step?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * hourly price × hours × quantity. The quantity is GPUs for a per-GPU price
 * and instances for a per-instance price — an instance price already covers
 * all of its GPUs, so it's never multiplied by the GPU count again.
 */
export function GpuCostCalculator({ options }: { options: GpuPriceOption[] }) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? CUSTOM);
  const [customPrice, setCustomPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [hours, setHours] = useState(HOURS_24_7);

  // Falls back to the first option when the list changes (new filters) under a stale selection.
  const option = options.find((o) => o.id === selectedId) ?? (selectedId === CUSTOM ? undefined : options[0]);
  const amount = option ? option.amount : customPrice;
  const currency = option?.currency ?? "USD";
  const perInstance = option?.unit === ComputePricingUnit.INSTANCE_HOUR;

  const price = toFixedPoint(amount);
  const qty = /^\d+$/.test(quantity) ? toFixedPoint(quantity) : null;
  const hrs = toFixedPoint(hours);
  const total = price != null && qty != null && hrs != null ? multiplyFixed(multiplyFixed(price, hrs), qty) : null;

  return (
    <CalculatorShell
      title="GPU rental cost"
      result={total != null ? formatFixedMoney(total, currency) : "—"}
      assumptions="Compute only, at the listed rate. Excludes storage, network egress, taxes and discounts. Spot capacity can be interrupted."
    >
      {options.length > 0 && (
        <PriceSelect
          id={`${id}-price`}
          options={options}
          value={option?.id ?? CUSTOM}
          onChange={setSelectedId}
          describe={(o) => `${formatMoney(o.amount, o.currency)} ${o.unit === ComputePricingUnit.GPU_HOUR ? "/ GPU / hr" : "/ instance / hr"}`}
        />
      )}
      {!option && (
        <NumberField id={`${id}-custom`} label="Price per GPU-hour (USD)" value={customPrice} onChange={setCustomPrice} step="0.01" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id={`${id}-qty`}
          label={perInstance ? "Instances" : "GPUs"}
          value={quantity}
          onChange={setQuantity}
          hint={perInstance && option?.gpuCount ? `Each instance has ${option.gpuCount} GPU${option.gpuCount === 1 ? "" : "s"}` : undefined}
        />
        <NumberField id={`${id}-hours`} label="Hours per month" value={hours} onChange={setHours} hint="730 = running 24/7" />
      </div>
    </CalculatorShell>
  );
}

const MILLION = toFixedPoint("1000000")!;

/** (input tokens / 1M × input price) + (output tokens / 1M × output price). */
export function InferenceCostCalculator({ options }: { options: InferencePriceOption[] }) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? CUSTOM);
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [inputMillions, setInputMillions] = useState("100");
  const [outputMillions, setOutputMillions] = useState("20");

  // Falls back to the first option when the list changes (new filters) under a stale selection.
  const option = options.find((o) => o.id === selectedId) ?? (selectedId === CUSTOM ? undefined : options[0]);
  const currency = option?.currency ?? "USD";
  const inPrice = toFixedPoint(option ? option.inputAmount : customInput);
  const outPrice = toFixedPoint(option ? option.outputAmount : customOutput);
  const inTokens = toFixedPoint(inputMillions);
  const outTokens = toFixedPoint(outputMillions);

  const total =
    inPrice != null && outPrice != null && inTokens != null && outTokens != null
      ? multiplyFixed(inPrice, inTokens) + multiplyFixed(outPrice, outTokens)
      : null;

  return (
    <CalculatorShell
      title="Inference cost"
      result={total != null ? formatFixedMoney(total, currency) : "—"}
      assumptions="Text tokens at the listed rates. Excludes prompt caching, batch discounts, image/audio input, minimums and taxes."
    >
      {options.length > 0 && (
        <PriceSelect
          id={`${id}-price`}
          options={options}
          value={option?.id ?? CUSTOM}
          onChange={setSelectedId}
          describe={(o) => `${formatMoney(o.inputAmount, o.currency)} in / ${formatMoney(o.outputAmount, o.currency)} out`}
        />
      )}
      {!option && (
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id={`${id}-in-price`} label="Input price / 1M tokens (USD)" value={customInput} onChange={setCustomInput} step="0.01" />
          <NumberField id={`${id}-out-price`} label="Output price / 1M tokens (USD)" value={customOutput} onChange={setCustomOutput} step="0.01" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id={`${id}-in`} label="Input tokens / month (millions)" value={inputMillions} onChange={setInputMillions} step="any" />
        <NumberField id={`${id}-out`} label="Output tokens / month (millions)" value={outputMillions} onChange={setOutputMillions} step="any" />
      </div>
      {inTokens != null && outTokens != null && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatTokens(multiplyFixed(inTokens, MILLION))} input + {formatTokens(multiplyFixed(outTokens, MILLION))} output tokens
        </p>
      )}
    </CalculatorShell>
  );
}

function formatTokens(scaled: bigint): string {
  return (scaled / toFixedPoint("1")!).toLocaleString("en-US");
}
