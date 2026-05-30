<script lang="ts">
  import { AnsiUp } from 'ansi_up';
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    ondone?: () => void;
  }

  let { ondone }: Props = $props();

  let outputEl: HTMLPreElement;
  let lines = $state<string[]>(['Ready.']);

  const ansi = new AnsiUp();
  ansi.use_classes = true;

  let eventSource: EventSource | null = null;

  onMount(() => {
    eventSource = new EventSource('/events');

    eventSource.onmessage = (e) => {
      lines = [...lines, e.data];
      requestAnimationFrame(() => {
        if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
      });
    };

    eventSource.addEventListener('done', () => {
      ondone?.();
    });

    eventSource.addEventListener('clear', () => {
      lines = [];
    });
  });

  onDestroy(() => {
    eventSource?.close();
  });

  function renderHtml(text: string): string {
    return ansi.ansi_to_html(text);
  }

  function clearOutput() {
    lines = ['Ready.'];
  }
</script>

<div class="terminal">
  <div class="terminal-header">
    <span class="terminal-title">Output</span>
    <button class="clear-btn" onclick={clearOutput}>Clear</button>
  </div>
  <pre class="output" bind:this={outputEl}>{#each lines as line}<span class="line">{@html renderHtml(line)}</span>{'\n'}{/each}</pre>
</div>

<style>
  .terminal {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-top: 1px solid #1e1e1e;
  }

  .terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: #0d0d0d;
    border-bottom: 1px solid #1e1e1e;
  }

  .terminal-title {
    font-size: 11px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .clear-btn {
    background: none;
    border: none;
    color: #444;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    padding: 2px 6px;
  }

  .clear-btn:hover {
    color: #888;
  }

  .output {
    flex: 1;
    margin: 0;
    padding: 12px 14px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #0a0a0a;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .line {
    display: block;
  }

  /* ANSI color classes for ansi_up */
  :global(.ansi-black-fg)   { color: #555; }
  :global(.ansi-red-fg)     { color: #f55; }
  :global(.ansi-green-fg)   { color: #5f5; }
  :global(.ansi-yellow-fg)  { color: #ff5; }
  :global(.ansi-blue-fg)    { color: #55f; }
  :global(.ansi-magenta-fg) { color: #f5f; }
  :global(.ansi-cyan-fg)    { color: #5ff; }
  :global(.ansi-white-fg)   { color: #fff; }

  :global(.ansi-bright-black-fg)   { color: #888; }
  :global(.ansi-bright-red-fg)     { color: #f88; }
  :global(.ansi-bright-green-fg)   { color: #8f8; }
  :global(.ansi-bright-yellow-fg)  { color: #ff8; }
  :global(.ansi-bright-blue-fg)    { color: #88f; }
  :global(.ansi-bright-magenta-fg) { color: #f8f; }
  :global(.ansi-bright-cyan-fg)    { color: #8ff; }
  :global(.ansi-bright-white-fg)   { color: #fff; }

  :global(.ansi-black-bg)   { background: #000; }
  :global(.ansi-red-bg)     { background: #a00; }
  :global(.ansi-green-bg)   { background: #0a0; }
  :global(.ansi-yellow-bg)  { background: #a50; }
  :global(.ansi-blue-bg)    { background: #00a; }
  :global(.ansi-magenta-bg) { background: #a0a; }
  :global(.ansi-cyan-bg)    { background: #0aa; }
  :global(.ansi-white-bg)   { background: #aaa; }

  :global(.ansi-bold) { font-weight: bold; }
  :global(.ansi-dim)  { opacity: 0.7; }
  :global(.ansi-italic) { font-style: italic; }
  :global(.ansi-underline) { text-decoration: underline; }

  .output::-webkit-scrollbar {
    width: 6px;
  }

  .output::-webkit-scrollbar-track {
    background: transparent;
  }

  .output::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }

  .output::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>
