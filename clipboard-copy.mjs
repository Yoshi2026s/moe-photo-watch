export function createCopyRequest(writeText) {
  let generation = 0;
  return {
    cancel() {
      generation++;
    },
    async write(text) {
      const id = ++generation;
      let result = 'copied';
      try {
        await writeText(text);
      } catch {
        result = 'manual';
      }
      return id === generation ? result : null;
    }
  };
}
