(() => {
  "use strict";

  const SUPPORT_TOKEN_STORAGE_KEY = "teamChapingoSupportToken";
  const PROPOSALS_API_URL = "api/proposals.php?limit=100";
  const SUPPORT_API_URL = "api/proposal-supports.php";
  const grid = document.getElementById("proposalsGrid");
  const status = document.getElementById("proposalsStatus");
  const search = document.getElementById("proposalSearch");
  const formatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
  let proposals = [];
  let browserToken = "";
  let storageAvailable = true;
  let supportReady = false;
  let supportError = "";

  try {
    browserToken = window.localStorage.getItem(SUPPORT_TOKEN_STORAGE_KEY) || "";
  } catch {
    storageAvailable = false;
  }

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  const makeText = (tag, value, className) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  };

  const makeIcon = (name) => {
    const element = document.createElement("i");
    element.dataset.lucide = name;
    element.setAttribute("aria-hidden", "true");
    return element;
  };

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
    }
  };

  const setLoadingState = () => {
    grid.classList.add("is-loading");
    grid.setAttribute("aria-busy", "true");
    grid.replaceChildren(...Array.from({ length: 4 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "proposal-skeleton";
      skeleton.setAttribute("aria-hidden", "true");
      return skeleton;
    }));
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Fecha no disponible" : formatter.format(date);
  };

  const getTitle = (proposal) => {
    const firstLine = proposal.proposal.split(/\r?\n/, 1)[0].trim();
    const sentence = firstLine.split(/(?<=[.!?])\s+/, 1)[0];
    const title = sentence || firstLine || proposal.proposal;
    return title.length > 74 ? `${title.slice(0, 71).trimEnd()}…` : title;
  };

  const getExcerpt = (proposal) => {
    const normalized = proposal.proposal.replace(/\s+/g, " ").trim();
    if (normalized.length <= 210) return normalized;
    return `${normalized.slice(0, 207).trimEnd()}…`;
  };

  const makeSupportRequest = async (payload) => {
    const response = await fetch(SUPPORT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "No se pudo guardar el voto.");
    return data;
  };

  const createToken = () => {
    if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
      throw new Error("Abre la página con HTTPS para registrar un apoyo de forma segura.");
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  const updateSupportDisplay = (proposal, count, button) => {
    count.textContent = new Intl.NumberFormat("es-MX").format(proposal.support_count);
    button.setAttribute("aria-pressed", String(proposal.supported));
    button.setAttribute("aria-label", proposal.supported
      ? `Quitar tu voto a ${getTitle(proposal)}`
      : `Votar a favor de ${getTitle(proposal)}`);
    button.classList.toggle("is-supported", proposal.supported);
    button.disabled = !supportReady || proposal.isBusy || !storageAvailable;
    const label = button.querySelector("span");
    label.textContent = proposal.isBusy ? "Guardando…" : proposal.supported ? "Quitar voto" : "Votar a favor";
  };

  const buildCard = (proposal) => {
    const card = document.createElement("article");
    card.className = "community-proposal-card";
    card.setAttribute("aria-labelledby", `proposal-${proposal.id}-title`);

    const meta = document.createElement("div");
    meta.className = "community-proposal-meta";
    const category = document.createElement("span");
    category.className = "proposal-card-category";
    category.append(makeIcon("user"), makeText("span", proposal.community_role || "Anónimo"));
    const date = makeText("time", formatDate(proposal.published_at), "community-proposal-date");
    date.dateTime = proposal.published_at;
    meta.append(category, date);

    const title = makeText("h2", getTitle(proposal), "community-proposal-title");
    title.id = `proposal-${proposal.id}-title`;
    const excerpt = makeText("p", getExcerpt(proposal), "community-proposal-text");

    const fullText = document.createElement("details");
    fullText.className = "proposal-full-text";
    fullText.append(makeText("summary", "Conocer propuesta completa"));
    fullText.append(makeText("p", proposal.proposal));

    const footer = document.createElement("div");
    footer.className = "community-proposal-footer";
    const supportTotal = document.createElement("p");
    supportTotal.className = "proposal-support-total";
    supportTotal.append(makeText("strong", "0", "proposal-support-count"), makeText("span", "votos a favor"));
    const supportButton = document.createElement("button");
    supportButton.className = "proposal-support-button";
    supportButton.type = "button";
    supportButton.setAttribute("aria-pressed", "false");
    supportButton.append(makeIcon("heart"), makeText("span", "Apoyar"));
    const supportStatus = makeText("span", "", "proposal-support-status");
    supportStatus.setAttribute("role", "status");
    supportStatus.setAttribute("aria-live", "polite");
    footer.append(supportTotal, supportButton);
    supportTotal.setAttribute("aria-label", "Votos a favor para esta propuesta");

    const count = supportTotal.querySelector(".proposal-support-count");
    updateSupportDisplay(proposal, count, supportButton);

    supportButton.addEventListener("click", async () => {
      if (!supportReady || proposal.isBusy || !storageAvailable) return;
      proposal.isBusy = true;
      updateSupportDisplay(proposal, count, supportButton);
      supportStatus.textContent = "";
      supportStatus.classList.remove("is-error");
      try {
        if (!browserToken) {
          browserToken = createToken();
          window.localStorage.setItem(SUPPORT_TOKEN_STORAGE_KEY, browserToken);
        }
        const action = proposal.supported ? "remove" : "support";
        const result = await makeSupportRequest({ action, proposalId: proposal.id, token: browserToken });
        proposal.supported = result.supported === true;
        proposal.support_count = Number.isSafeInteger(result.total) ? Math.max(0, result.total) : proposal.support_count;
        supportStatus.textContent = proposal.supported ? "Voto registrado." : "Quitaste tu voto.";
        supportButton.classList.remove("is-animating");
        count.classList.remove("is-animated");
        void supportButton.offsetWidth;
        supportButton.classList.add("is-animating");
        count.classList.add("is-animated");
      } catch (error) {
        supportStatus.textContent = error instanceof TypeError
          ? "No se pudo conectar. Inténtalo de nuevo."
          : error.message || "No se pudo guardar el voto.";
        supportStatus.classList.add("is-error");
      } finally {
        proposal.isBusy = false;
        updateSupportDisplay(proposal, count, supportButton);
      }
    });

    card.append(meta, title, excerpt, fullText, footer, supportStatus);
    return card;
  };

  const render = () => {
    const query = search.value.trim().toLocaleLowerCase("es-MX");
    const visible = proposals.filter((proposal) => {
      return `${proposal.proposal}`.toLocaleLowerCase("es-MX").includes(query);
    });

    grid.classList.remove("is-loading");
    grid.setAttribute("aria-busy", "false");
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "proposals-empty reveal is-visible";
      empty.append(
        makeText("strong", query ? "No encontramos coincidencias." : "Aún no hay propuestas publicadas."),
        makeText("span", query ? "Prueba con otra palabra." : "Vuelve pronto para conocer las ideas de la comunidad.")
      );
      grid.replaceChildren(empty);
      setStatus("");
      return;
    }

    grid.replaceChildren(...visible.map(buildCard));
    const statusMessage = supportError || (!storageAvailable ? "Activa el almacenamiento de este navegador para apoyar propuestas." : "");
    setStatus(statusMessage, Boolean(supportError) || !storageAvailable);
    refreshIcons();
  };

  const loadSupportStates = async () => {
    if (!storageAvailable) {
      supportReady = true;
      return;
    }
    if (!browserToken || !proposals.length) {
      supportReady = true;
      return;
    }
    try {
      const result = await makeSupportRequest({
        action: "statuses",
        token: browserToken,
        proposalIds: proposals.map((proposal) => proposal.id)
      });
      const supportedIds = new Set(Array.isArray(result.supported_ids) ? result.supported_ids : []);
      proposals.forEach((proposal) => { proposal.supported = supportedIds.has(proposal.id); });
      supportReady = true;
      supportError = "";
    } catch {
      supportReady = false;
      supportError = "No se pudieron cargar tus votos. Actualiza la página e inténtalo de nuevo.";
    }
  };

  const load = async () => {
    setLoadingState();
    try {
      const response = await fetch(PROPOSALS_API_URL, { headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "No pudimos cargar las propuestas.");
      proposals = Array.isArray(data.proposals)
        ? data.proposals
          .filter((proposal) => Number.isSafeInteger(Number(proposal.id)) && typeof proposal.proposal === "string")
          .map((proposal) => ({
            ...proposal,
            id: Number(proposal.id),
            support_count: Number.isSafeInteger(Number(proposal.support_count)) ? Math.max(0, Number(proposal.support_count)) : 0,
            supported: false,
            isBusy: false
          }))
        : [];
      await loadSupportStates();
      render();
    } catch (error) {
      grid.classList.remove("is-loading");
      grid.setAttribute("aria-busy", "false");
      grid.replaceChildren();
      setStatus(error instanceof TypeError
        ? "No se pudo conectar con el registro de propuestas. Inténtalo de nuevo más tarde."
        : error.message || "No pudimos cargar las propuestas en este momento.", true);
    }
  };

  search.addEventListener("input", render);
  window.addEventListener("storage", async (event) => {
    if (event.key !== SUPPORT_TOKEN_STORAGE_KEY) return;
    browserToken = event.newValue || "";
    proposals.forEach((proposal) => { proposal.supported = false; });
    supportReady = false;
    await loadSupportStates();
    render();
  });

  load();
})();
