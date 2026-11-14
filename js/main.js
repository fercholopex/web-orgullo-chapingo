    (() => {
      "use strict";

      const strategicGoals = [
        { value: "2,000", description: "Becados internos", axis: "Eje 01 · Estudiantes al centro", icon: "graduation-cap" },
        { value: "7 de cada 10", description: "Concluyen la Preparatoria a tiempo", axis: "Eje 02 · Formación de excelencia", icon: "book-open-check" },
        { value: "80%", description: "De edificios accesibles", axis: "Eje 03 · Universidad segura", icon: "accessibility" },
        { value: "5%", description: "Del gasto destinado a mantenimiento", axis: "Eje 04 · Infraestructura", icon: "building-2" },
        { value: "8 sedes", description: "Con servicio de Propedéutico", axis: "Eje 05 · Presencia regional", icon: "map-pinned" },
        { value: "0 hectáreas perdidas", description: "Protección del patrimonio universitario", axis: "Eje 09 · Patrimonio", icon: "trees" }
      ];

      // Contenido inicial proporcionado por la campaña. Fuentes y metodología pendientes de validar.
      const axes = [
        {
          number: "01", category: "Estudiantes al centro", title: "Cama, comida y beca para quien la necesite.",
          diagnosis: [{ value: "1,516", detail: "becados internos hoy; eran 2,170 en 2012" }, { value: "1,681", detail: "estudiantes externos sin ningún apoyo" }],
          problem: "El internado no se cerró: se dejó caer. Y el costo lo pagan las familias del campo.",
          commitments: ["Construcción de nuevos dormitorios y rehabilitación de módulos existentes", "Apoyo de alojamiento, transporte y alimentación para estudiantes externos", "Pago puntual de becas"],
          goal: "2,000 becados internos", indicator: "Número de estudiantes internos beneficiados"
        },
        {
          number: "02", category: "Formación de excelencia", title: "Ningún grupo sin profesor desde el primer día.",
          diagnosis: [{ value: "53%", detail: "termina la Prepa a tiempo; era 64% en 2022" }, { value: "47%", detail: "de egresados de licenciatura se titula" }],
          problem: "Grupos sin profesor y prácticas sin presupuesto. Lo que la Universidad no paga, lo paga el estudiante.",
          commitments: ["Vacantes cubiertas en menos de 30 días", "Prácticas y viajes pagados antes de que empiece el semestre", "Kardex, certificados y titulación en línea"],
          goal: "7 de cada 10 terminan la Prepa a tiempo", indicator: "Porcentaje de estudiantes que concluyen la Preparatoria en tiempo"
        },
        {
          number: "03", category: "Universidad segura", title: "Una Universidad donde nadie tenga miedo.",
          diagnosis: [{ value: "3,125", detail: "estudiantes son menores de edad" }, { value: "938", detail: "adolescentes viven solos en el internado" }],
          problem: "Protocolos de protección incompletos y temor a represalias por opinar o disentir.",
          commitments: ["Protocolo Único contra la Violencia de Género", "Protección de menores en el internado con personal acreditado", "Nadie será sancionado por disentir"],
          goal: "80% de edificios accesibles", indicator: "Porcentaje de edificios que cumplen criterios de accesibilidad"
        },
        {
          number: "04", category: "Infraestructura", title: "Un campus que funcione.",
          diagnosis: [{ value: "$0", detail: "de inversión en equipo e infraestructura en 2024 y 2025" }, { value: "3.6%", detail: "del gasto se destina a mantenimiento" }],
          problem: "Primero se paga la nómina; lo que sobra no alcanza para cuidar dormitorios, baños, aulas y laboratorios.",
          commitments: ["Plan Maestro de Infraestructura hecho con la comunidad", "Fondo de mantenimiento que no se toca para la nómina", "Internet en aulas, bibliotecas y dormitorios"],
          goal: "5% del gasto a mantenimiento", indicator: "Porcentaje del gasto total destinado al mantenimiento"
        },
        {
          number: "05", category: "Presencia regional", title: "Chapingo regresa a las regiones.",
          diagnosis: [{ value: "8 → 6", detail: "sedes con Propedéutico entre 2024 y 2025" }, { value: "63%", detail: "del Propedéutico habla una lengua indígena" }],
          problem: "Se cerraron grupos sin consultar a nadie. Así se le cierra la puerta al campo.",
          commitments: ["Mesas con San Luis Acatlán, Mérida y Zacatecas en cien días", "Reabrir el Propedéutico donde haya demanda", "Ningún grupo se cierra sin consulta"],
          goal: "8 sedes con Propedéutico", indicator: "Número de sedes regionales operativas"
        },
        {
          number: "09", category: "Patrimonio", title: "Lo que es de Chapingo se defiende.",
          diagnosis: [{ value: "1,640", detail: "hectáreas de bosque en Zoquiapan con acceso restringido, según el material" }, { value: "2025", detail: "prácticas suspendidas desde octubre, según el material" }],
          problem: "El material de campaña señala falta de padrón y defensa jurídica, y un riesgo para el patrimonio universitario.",
          commitments: ["Padrón público de predios durante el primer año", "Recuperar las condiciones de acceso a Zoquiapan, con expediente abierto y seguimiento", "Defensa legal activa del patrimonio universitario"],
          goal: "Cero hectáreas perdidas", indicator: "Hectáreas conservadas y situación jurídica documentada"
        }
      ];

      const agenda = [
        { period: "Dentro de los primeros 100 días", title: "Mesas de trabajo regionales", detail: "Encuentros con las comunidades de San Luis Acatlán, Mérida y Zacatecas para escuchar necesidades y revisar la presencia regional.", proof: "Minutas públicas y acuerdos de seguimiento propuestos." },
        { period: "Dentro de los primeros 100 días", title: "Revisión de las condiciones del internado", detail: "Recorrido y diagnóstico de dormitorios, servicios, becas y necesidades de estudiantes internos y externos.", proof: "Informe de condiciones y prioridades de atención." },
        { period: "Dentro de los primeros 100 días", title: "Diagnóstico de infraestructura y mantenimiento", detail: "Identificar necesidades prioritarias en dormitorios, baños, aulas, laboratorios y conectividad.", proof: "Inventario de necesidades y criterios para el plan maestro." },
        { period: "Dentro de los primeros 100 días", title: "Revisión de cobertura académica", detail: "Revisar grupos sin docente, vacantes, prácticas y necesidades de apoyo académico.", proof: "Matriz de cobertura y mecanismo de seguimiento." },
        { period: "Dentro de los primeros 100 días", title: "Información patrimonial abierta", detail: "Integrar y publicar información del padrón de predios y su documentación disponible.", proof: "Padrón público con situación documental y actualizaciones." }
      ];

      const icon = (name, className = "") => {
        const element = document.createElement("i");
        element.dataset.lucide = name;
        element.setAttribute("aria-hidden", "true");
        if (className) element.className = className;
        return element;
      };

      const makeText = (tag, text, className) => {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
      };

      function buildAxisCard(axis) {
        const card = document.createElement("article");
        card.className = "axis-card reveal";
        card.setAttribute("aria-labelledby", `axis-${axis.number}-title`);

        const head = document.createElement("div");
        head.className = "axis-head";
        head.append(makeText("span", axis.number, "axis-number"));
        const titleBlock = document.createElement("div");
        titleBlock.append(makeText("span", `Eje ${axis.number} · ${axis.category}`, "axis-label"));
        titleBlock.append(makeText("h3", axis.title, "axis-title"));
        titleBlock.lastElementChild.id = `axis-${axis.number}-title`;
        head.append(titleBlock);
        card.append(head);

        const diagnosis = document.createElement("div");
        diagnosis.className = "axis-diagnosis";
        diagnosis.setAttribute("aria-label", "Diagnóstico inicial de campaña; fuente pendiente de validar");
        axis.diagnosis.forEach((item) => {
          const metric = document.createElement("div");
          metric.className = "axis-metric";
          metric.append(makeText("strong", item.value), makeText("span", item.detail));
          diagnosis.append(metric);
        });
        card.append(diagnosis);
        const source = makeText("small", "Dato de campaña · fuente por validar", "source-tag");
        source.prepend(icon("file-question"));
        card.append(source);
        card.append(makeText("p", axis.problem, "axis-problem"));
        card.append(makeText("h4", "Compromisos", "axis-subhead"));
        const commitments = document.createElement("ul");
        commitments.className = "axis-commitments";
        axis.commitments.forEach((item) => commitments.append(makeText("li", item)));
        card.append(commitments);

        const footer = document.createElement("div");
        footer.className = "axis-card-footer";
        const goal = document.createElement("div");
        goal.className = "axis-goal";
        goal.append(makeText("span", "Meta propuesta al 2031"), makeText("strong", axis.goal));
        footer.append(goal);
        const indicator = document.createElement("div");
        indicator.className = "axis-indicator";
        indicator.append(makeText("strong", "Indicador"), makeText("span", axis.indicator));
        footer.append(indicator);
        card.append(footer);
        return card;
      }

      function buildGoalCard(goal) {
        const card = document.createElement("article");
        card.className = "goal-card reveal";
        card.setAttribute("aria-label", `${goal.axis}: ${goal.value}, ${goal.description}`);
        const cardIcon = document.createElement("span");
        cardIcon.className = "goal-icon";
        cardIcon.append(icon(goal.icon));
        card.append(cardIcon, makeText("strong", goal.value, "goal-number"));
        card.append(makeText("span", goal.description, "goal-description"));
        card.append(makeText("span", goal.axis, "goal-axis"));
        return card;
      }

      function buildTimelineItem(item, index) {
        const article = document.createElement("article");
        article.className = "timeline-item";
        const marker = makeText("span", String(index + 1).padStart(2, "0"), "timeline-marker");
        marker.setAttribute("aria-hidden", "true");
        const content = document.createElement("div");
        content.className = "timeline-content";
        content.append(makeText("span", item.period, "timeline-period"), makeText("h3", item.title), makeText("p", item.detail));
        const proof = makeText("span", item.proof, "timeline-proof");
        proof.prepend(icon("file-check-2"));
        content.append(proof);
        article.append(marker, content);
        return article;
      }

      function renderContent() {
        const axesGrid = document.getElementById("axesGrid");
        const goalsGrid = document.getElementById("goalsGrid");
        const timeline = document.getElementById("timeline");
        axesGrid.replaceChildren(...axes.map(buildAxisCard));
        goalsGrid.replaceChildren(...strategicGoals.map(buildGoalCard));
        timeline.replaceChildren(...agenda.map(buildTimelineItem));
        const disclaimer = makeText("p", "La secuencia y las evidencias descritas son propuestas de seguimiento; no indican que estas acciones ya se hayan realizado.", "agenda-disclaimer");
        timeline.append(disclaimer);
        refreshIcons();
        observeReveals();
      }

      function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
        }
      }

      function setupNavigation() {
        const header = document.getElementById("siteHeader");
        const nav = document.getElementById("primaryNav");
        const toggle = document.getElementById("menuToggle");
        const navLinks = [...nav.querySelectorAll("a[href^='#']")];
        const allNavLinks = [...nav.querySelectorAll("a")];
        const sectionTargets = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
        const mobileQuery = window.matchMedia("(max-width: 800px)");

        const closeMenu = (restoreFocus = false) => {
          const wasOpen = nav.classList.contains("is-open");
          nav.classList.remove("is-open");
          document.body.classList.remove("menu-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Abrir menú");
          toggle.replaceChildren(icon("menu"));
          nav.inert = mobileQuery.matches;
          nav.setAttribute("aria-hidden", String(mobileQuery.matches));
          refreshIcons();
          if (restoreFocus && wasOpen) toggle.focus();
        };

        toggle.addEventListener("click", () => {
          if (nav.classList.contains("is-open")) {
            closeMenu();
            return;
          }
          nav.classList.add("is-open");
          document.body.classList.add("menu-open");
          nav.inert = false;
          nav.setAttribute("aria-hidden", "false");
          toggle.setAttribute("aria-expanded", "true");
          toggle.setAttribute("aria-label", "Cerrar menú");
          toggle.replaceChildren(icon("x"));
          refreshIcons();
          nav.querySelector("a")?.focus();
        });

        allNavLinks.forEach((link) => link.addEventListener("click", () => closeMenu()));
        document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(true); });
        document.addEventListener("click", (event) => {
          if (nav.classList.contains("is-open") && !header.contains(event.target)) closeMenu();
        });
        if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", () => closeMenu());
        else mobileQuery.addListener(() => closeMenu());
        closeMenu();
        window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 24), { passive: true });

        if ("IntersectionObserver" in window) {
          const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              navLinks.forEach((link) => link.classList.toggle("is-active", link.hash === `#${entry.target.id}`));
            });
          }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
          sectionTargets.forEach((section) => sectionObserver.observe(section));
        }
      }

      let revealObserver;
      function observeReveals() {
        const revealItems = document.querySelectorAll(".reveal:not(.is-visible)");
        if (!("IntersectionObserver" in window)) {
          revealItems.forEach((item) => item.classList.add("is-visible"));
          return;
        }
        if (!revealObserver) {
          revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            });
          }, { threshold: .08, rootMargin: "0px 0px -30px 0px" });
        }
        revealItems.forEach((item, index) => {
          item.style.transitionDelay = `${Math.min(index % 6, 4) * 55}ms`;
          revealObserver.observe(item);
        });
      }

      function setupPrivacyDialog() {
        const dialog = document.getElementById("privacyDialog");
        const open = () => { if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", ""); };
        const close = () => { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); };
        document.getElementById("footerPrivacy").addEventListener("click", open);
        document.getElementById("closePrivacy").addEventListener("click", close);
        document.getElementById("closePrivacyAction").addEventListener("click", close);
        dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
      }

      function setFormStatus(message, state = "info") {
        const status = document.getElementById("formStatus");
        status.textContent = message;
        status.className = `form-status is-${state}`;
      }

      function setupForm() {
        const form = document.getElementById("participationForm");
        const authorName = document.getElementById("authorName");
        const comments = document.getElementById("comments");
        const website = document.getElementById("website");
        const publishConsent = document.getElementById("publishConsent");
        const submitButton = document.getElementById("submitButton");
        let isSubmitting = false;

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (isSubmitting) return;
          const proposal = comments.value.trim();
          const author = authorName ? (authorName.value.trim() || "Anónimo") : "Anónimo";
          const characterCount = [...proposal].length;
          if (characterCount < 10 || characterCount > 800) {
            setFormStatus("Escribe una propuesta de entre 10 y 800 caracteres.", "info");
            comments.focus();
            return;
          }
          if (!publishConsent.checked) {
            setFormStatus("Acepta que tu propuesta sea publicada para poder enviarla.", "info");
            publishConsent.focus();
            return;
          }

          try {
            isSubmitting = true;
            submitButton.disabled = true;
            const response = await fetch("api/proposals.php", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                author,
                proposal,
                publishConsent: publishConsent.checked,
                website: website.value
              })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "No se pudo enviar la propuesta.");
            form.reset();
            setFormStatus(result.message || "¡Gracias! Tu propuesta ha sido publicada con éxito.", "success");
          } catch (error) {
            const message = error instanceof TypeError
              ? "No se pudo conectar con el registro. Revisa que api/proposals.php esté instalado y MySQL esté configurado."
              : error.message || "No se pudo enviar la propuesta. Inténtalo de nuevo.";
            setFormStatus(message, "error");
          } finally {
            isSubmitting = false;
            submitButton.disabled = false;
          }
        });
      }

      function setupCommunityVote() {
        const SUPPORT_TOKEN_KEY = "teamChapingoSupportToken";
        const GENERAL_VOTE_KEY = "teamChapingoGeneralVote";
        const VOTES_API = "api/votes.php";

        const countEl = document.getElementById("communityVoteCount");
        const mainBtn = document.getElementById("mainVoteButton");
        const mainBtnText = document.getElementById("mainVoteBtnText");
        const badgeInc = document.getElementById("voteIncBadge");
        const statusFeedback = document.getElementById("voteStatusFeedback");
        const heroBtn = document.getElementById("heroVoteBtn");
        const ambientContainer = document.getElementById("voteAmbientHearts");

        if (!countEl || !mainBtn) return;

        let totalVotes = 376;
        let hasVoted = false;
        let browserToken = "";

        try {
          browserToken = window.localStorage.getItem(SUPPORT_TOKEN_KEY) || "";
          if (!browserToken) {
            browserToken = typeof crypto?.randomUUID === "function"
              ? crypto.randomUUID()
              : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
                  (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
                );
            window.localStorage.setItem(SUPPORT_TOKEN_KEY, browserToken);
          }
          hasVoted = window.localStorage.getItem(GENERAL_VOTE_KEY) === "1";
        } catch {
          // localStorage no disponible
        }

        const formatNumber = (num) => new Intl.NumberFormat("es-MX").format(num);

        const updateDisplay = () => {
          countEl.textContent = formatNumber(totalVotes);
          if (hasVoted) {
            mainBtn.classList.add("is-voted");
            mainBtn.disabled = true;
            mainBtn.setAttribute("aria-pressed", "true");
            if (mainBtnText) mainBtnText.textContent = "¡Ya votaste!";
            if (statusFeedback) {
              statusFeedback.textContent = "¡Muchas gracias por apoyar a Chapingo!";
              statusFeedback.classList.add("is-visible");
            }
          }
        };

        const fetchVotes = async () => {
          try {
            const url = browserToken ? `${VOTES_API}?token=${encodeURIComponent(browserToken)}` : VOTES_API;
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            if (!res.ok) return;
            const data = await res.json();
            if (data.ok && Number.isSafeInteger(data.total)) {
              totalVotes = Math.max(totalVotes, data.total);
              if (data.supported) hasVoted = true;
              updateDisplay();
            }
          } catch {
            // Silencioso; usa datos locales
          }
        };

        const heartColors = [
          "#00B050", // Verde Chapingo
          "#44D487", // Verde claro
          "#FF3366", // Rosa vivo
          "#FF5252", // Rojo coral
          "#FFB800", // Oro
          "#2D52EC", // Azul eléctrico
          "#A855F7"  // Púrpura suave
        ];

        const spawnHeartExplosion = (sourceEl) => {
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const rect = sourceEl ? sourceEl.getBoundingClientRect() : null;
          const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
          const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

          const count = 22;
          for (let i = 0; i < count; i++) {
            const heart = document.createElement("div");
            heart.className = "flying-heart-particle";

            const size = Math.floor(Math.random() * 18) + 16;
            const color = heartColors[Math.floor(Math.random() * heartColors.length)];
            const xShift1 = (Math.random() - 0.5) * 60;
            const xShift2 = (Math.random() - 0.5) * 140;
            const xShift3 = (Math.random() - 0.5) * 220;
            const rot1 = (Math.random() - 0.5) * 35;
            const rot2 = (Math.random() - 0.5) * 65;
            const rot3 = (Math.random() - 0.5) * 90;
            const duration = (Math.random() * 0.4 + 1.2).toFixed(2);
            const delay = (Math.random() * 0.12).toFixed(2);

            heart.style.cssText = `
              left: ${originX - size / 2}px;
              top: ${originY - size / 2}px;
              width: ${size}px;
              height: ${size}px;
              --x-shift-1: ${xShift1}px;
              --x-shift-2: ${xShift2}px;
              --x-shift-3: ${xShift3}px;
              --rot-1: ${rot1}deg;
              --rot-2: ${rot2}deg;
              --rot-3: ${rot3}deg;
              animation-duration: ${duration}s;
              animation-delay: ${delay}s;
            `;

            heart.innerHTML = `
              <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" style="display:block;">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            `;

            document.body.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove(), { once: true });
          }
        };

        const setupAmbient = () => {
          if (!ambientContainer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const spawnAmbientHeart = () => {
            if (document.hidden) return;
            const heart = document.createElement("div");
            heart.className = "ambient-heart";
            const size = Math.floor(Math.random() * 16) + 14;
            const color = heartColors[Math.floor(Math.random() * heartColors.length)];
            const left = Math.random() * 92 + 4;
            const driftX = (Math.random() - 0.5) * 80;
            const rot = (Math.random() - 0.5) * 50;
            const opacity = (Math.random() * 0.16 + 0.16).toFixed(2);
            const duration = (Math.random() * 4 + 7).toFixed(1);

            heart.style.cssText = `
              left: ${left}%;
              width: ${size}px;
              height: ${size}px;
              --drift-x: ${driftX}px;
              --rot-deg: ${rot}deg;
              --ambient-op: ${opacity};
              animation-duration: ${duration}s;
            `;

            heart.innerHTML = `
              <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" style="display:block;">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            `;

            ambientContainer.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove(), { once: true });
          };

          for (let i = 0; i < 4; i++) {
            setTimeout(spawnAmbientHeart, i * 600);
          }
          setInterval(spawnAmbientHeart, 1600);
        };

        const handleVoteClick = async (sourceElement) => {
          if (hasVoted) return; // ← Un solo voto por persona

          spawnHeartExplosion(sourceElement || mainBtn);

          if (badgeInc) {
            badgeInc.classList.remove("is-floating");
            void badgeInc.offsetWidth;
            badgeInc.classList.add("is-floating");
          }

          totalVotes += 1;
          hasVoted = true;

          countEl.classList.remove("is-animating");
          void countEl.offsetWidth;
          countEl.classList.add("is-animating");

          updateDisplay();

          try {
            window.localStorage.setItem(GENERAL_VOTE_KEY, "1");
          } catch {}

          try {
            const res = await fetch(VOTES_API, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ action: "vote", token: browserToken })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.ok && Number.isSafeInteger(data.total)) {
                totalVotes = Math.max(totalVotes, data.total);
                updateDisplay();
              }
            }
          } catch {
            // Guardado local exitoso
          }
        };

        mainBtn.addEventListener("click", () => handleVoteClick(mainBtn));

        if (heroBtn) {
          heroBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleVoteClick(heroBtn);
            const target = document.getElementById("votar");
            if (target) {
              target.scrollIntoView({ behavior: "smooth" });
            }
          });
        }

        updateDisplay();
        fetchVotes();
        setupAmbient();
      }

      function initialize() {
        renderContent();
        setupNavigation();
        setupPrivacyDialog();
        setupCommunityVote();
        setupForm();
        refreshIcons();
        observeReveals();
      }

      window.teamChapingoInitializeMain = initialize;
    })();
