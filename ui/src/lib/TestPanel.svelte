<script lang="ts">
  import Terminal from './Terminal.svelte';

  interface TestEntry { suite: string; file: string; name: string }

  let running = $state<string | null>(null);
  let tests = $state<TestEntry[]>([]);
  let selectedTest = $state('');

  $effect(() => {
    fetch('/api/tests')
      .then(r => r.json())
      .then((data: TestEntry[]) => { tests = data; });
  });

  async function runTests() {
    if (running) return;
    running = selectedTest || 'all';
    const url = selectedTest
      ? `/run/integration?test=${encodeURIComponent(selectedTest)}`
      : '/run/integration';
    await fetch(url, { method: 'POST' });
  }

  async function resetWorld() {
    const layout = { fillRegions: [], placedBlocks: [], spawnPoint: { x: 0, y: 1, z: 0 } };
    await fetch('/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout),
    });
  }

  function onTestDone() {
    running = null;
  }
</script>

<div class="panel">
  <header>
    <h1>Tests</h1>
  </header>

  <div class="toolbar">
    <select
      bind:value={selectedTest}
      disabled={running !== null}
    >
      <option value="">All tests</option>
      {#each tests as test}
        <option value={test.name}>{test.name}</option>
      {/each}
    </select>
    <button
      class:active={running !== null}
      disabled={running !== null}
      onclick={runTests}
    >
      Run
    </button>
    <button
      class="secondary"
      onclick={resetWorld}
    >
      Reset World
    </button>
  </div>

  <Terminal ondone={onTestDone} />
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 0;
  }

  header {
    padding: 12px 14px 0;
  }

  h1 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .toolbar {
    display: flex;
    gap: 6px;
    padding: 10px 14px;
    flex-wrap: wrap;
    align-items: center;
  }

  select {
    flex: 1;
    min-width: 0;
    background: #1e1e1e;
    color: #ccc;
    border: 1px solid #333;
    padding: 6px 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 24px;
  }

  select:disabled {
    opacity: 0.4;
    cursor: default;
  }

  select:focus {
    outline: none;
    border-color: #555;
  }

  button {
    background: #1e1e1e;
    color: #ccc;
    border: 1px solid #333;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }

  button:hover:not(:disabled) {
    background: #252525;
    border-color: #555;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  button.active {
    border-color: #e8a020;
    color: #e8a020;
  }

  button.secondary {
    color: #666;
    border-color: #2a2a2a;
  }

  button.secondary:hover {
    color: #999;
    border-color: #444;
  }
</style>
