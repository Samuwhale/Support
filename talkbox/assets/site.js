(() => {
  const root = document.querySelector("[data-sampler]");
  const source = document.getElementById("sampler-data");
  if (!root || !source) return;
  const { prompts, labels, initialDeck, chooseFirst } = JSON.parse(
    source.textContent,
  );
  const question = root.querySelector("[data-question]");
  const next = root.querySelector("[data-next]");
  const share = root.querySelector("[data-share]");
  const status = root.querySelector("[data-status]");
  const choices = [...root.querySelectorAll("[data-deck]")];
  const byId = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  let current = null;
  let deck = initialDeck;
  const remaining = new Map();

  function takeOne() {
    let pool = remaining
      .get(deck)
      ?.filter((prompt) => prompt.id !== current?.id);
    if (!pool?.length) {
      pool = prompts
        .filter((prompt) => deck === "all" || prompt.deck === deck)
        .filter((prompt) => prompt.id !== current?.id);
    }
    if (!pool.length) return;
    const index = Math.floor(Math.random() * pool.length);
    const [chosen] = pool.splice(index, 1);
    remaining.set(deck, pool);
    show(chosen, true);
  }

  function show(prompt, updateURL) {
    current = prompt;
    deck = chooseFirst ? prompt.deck : deck;
    question.textContent = prompt.text;
    share.disabled = false;
    next.hidden = false;
    status.textContent = "";
    for (const button of choices) {
      button.setAttribute("aria-pressed", String(button.dataset.deck === deck));
    }
    if (updateURL) history.replaceState(null, "", `#q-${prompt.id}`);
  }

  function fromHash() {
    const prompt = byId.get(location.hash.replace(/^#q-/, ""));
    if (prompt) {
      deck = prompt.deck;
      show(prompt, false);
      return true;
    }
    return false;
  }

  choices.forEach((button) =>
    button.addEventListener("click", () => {
      deck = button.dataset.deck;
      takeOne();
    }),
  );
  next.addEventListener("click", takeOne);
  window.addEventListener("hashchange", fromHash);

  share.addEventListener("click", async () => {
    if (!current) return;
    const url = `${location.origin}${location.pathname}#q-${current.id}`;
    const payload = { title: "Talkbox", text: current.text, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(`${current.text}\n${url}`);
      status.textContent = labels.copied;
    } catch (error) {
      if (error.name === "AbortError") return;
      const link = document.createElement("a");
      link.href = url;
      link.textContent = labels.copyLink;
      status.replaceChildren(
        document.createTextNode(`${labels.fallback} `),
        link,
      );
    }
  });

  if (!fromHash()) {
    if (chooseFirst) {
      question.textContent = labels.choose;
      share.disabled = true;
      next.hidden = true;
    } else {
      const first = prompts.find(
        (prompt) => deck === "all" || prompt.deck === deck,
      );
      if (first) show(first, false);
    }
  }
})();
