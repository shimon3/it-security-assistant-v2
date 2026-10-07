import { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// ---- Utilities ----

function base64Encode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function base64Decode(input: string): string {
  try {
    return decodeURIComponent(escape(atob(input.trim())));
  } catch {
    return 'Invalid Base64';
  }
}

function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return 'Invalid URL encoding';
  }
}

function toHex(input: string): string {
  return Array.from(input)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}

function fromHex(input: string): string {
  try {
    const pairs = input.trim().split(/\s+/);
    return pairs
      .map((pair) => {
        const code = parseInt(pair, 16);
        if (isNaN(code)) throw new Error('bad hex');
        return String.fromCharCode(code);
      })
      .join('');
  } catch {
    return 'Invalid Hex';
  }
}

// ---- Sub-components ----

interface SectionProps {
  title: string;
  inputValue: string;
  outputValue: string;
  onInputChange: (v: string) => void;
  onEncode: () => void;
  onDecode: () => void;
  encodeLabel: string;
  decodeLabel: string;
}

function EncoderSection({
  title,
  inputValue,
  outputValue,
  onInputChange,
  onEncode,
  onDecode,
  encodeLabel,
  decodeLabel,
}: SectionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!outputValue) return;
    await navigator.clipboard.writeText(outputValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-ink-2">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted font-medium uppercase tracking-wide">Input</label>
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            rows={4}
            placeholder="Enter text here..."
            className="w-full bg-sunken border border-line-strong rounded-lg px-3 py-2.5 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm font-mono resize-none"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted font-medium uppercase tracking-wide">Output</label>
            <button
              onClick={handleCopy}
              disabled={!outputValue}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed border border-line-strong hover:border-line-strong px-2.5 py-1 rounded-lg transition-all"
              aria-label="Copy output"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <textarea
            value={outputValue}
            readOnly
            rows={4}
            placeholder="Result will appear here..."
            className="w-full bg-sunken border border-line-strong rounded-lg px-3 py-2.5 text-brand-strong placeholder-faint focus:outline-none text-sm font-mono resize-none cursor-default"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEncode}
          disabled={!inputValue}
          className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/30 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-all text-sm"
        >
          {encodeLabel}
        </button>
        <button
          onClick={onDecode}
          disabled={!inputValue}
          className="flex items-center gap-2 bg-sunken hover:bg-line border border-line-strong hover:border-line-strong disabled:opacity-40 disabled:cursor-not-allowed text-ink font-medium px-4 py-2 rounded-lg transition-all text-sm"
        >
          {decodeLabel}
        </button>
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function EncoderPage() {
  // Base64 state
  const [b64Input, setB64Input] = useState('');
  const [b64Output, setB64Output] = useState('');

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');

  // Hex state
  const [hexInput, setHexInput] = useState('');
  const [hexOutput, setHexOutput] = useState('');

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Code2 className="w-5 h-5 text-brand" />}
        title="Encoder / Decoder"
        description="Encode and decode Base64, URL, and Hex strings"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">

        {/* Base64 */}
        <EncoderSection
          title="Base64"
          inputValue={b64Input}
          outputValue={b64Output}
          onInputChange={(v) => { setB64Input(v); setB64Output(''); }}
          onEncode={() => setB64Output(base64Encode(b64Input))}
          onDecode={() => setB64Output(base64Decode(b64Input))}
          encodeLabel="Encode →"
          decodeLabel="← Decode"
        />

        {/* URL Encode */}
        <EncoderSection
          title="URL Encode"
          inputValue={urlInput}
          outputValue={urlOutput}
          onInputChange={(v) => { setUrlInput(v); setUrlOutput(''); }}
          onEncode={() => setUrlOutput(urlEncode(urlInput))}
          onDecode={() => setUrlOutput(urlDecode(urlInput))}
          encodeLabel="Encode →"
          decodeLabel="← Decode"
        />

        {/* Hex */}
        <EncoderSection
          title="Hex"
          inputValue={hexInput}
          outputValue={hexOutput}
          onInputChange={(v) => { setHexInput(v); setHexOutput(''); }}
          onEncode={() => setHexOutput(toHex(hexInput))}
          onDecode={() => setHexOutput(fromHex(hexInput))}
          encodeLabel="To Hex →"
          decodeLabel="← From Hex"
        />

      </div>
    </div>
  );
}
