    (() => {
      "use strict";

      const SUPPORT_STORAGE_KEY = "teamChapingoSupport";

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

      function buildGoalCard(axis) {
        const card = document.createElement("article");
        card.className = "goal-card reveal";
        card.setAttribute("aria-label", `Eje ${axis.number}: meta al 2031, ${axis.goal}`);
        card.append(makeText("strong", axis.goal, "goal-number"));
        card.append(makeText("span", `Eje ${axis.number} · ${axis.category}`, "goal-axis"));
        card.append(makeText("span", axis.indicator, "goal-description"));
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
        goalsGrid.replaceChildren(...axes.map(buildGoalCard));
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
        const sectionTargets = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

        const closeMenu = () => {
          nav.classList.remove("is-open");
          document.body.classList.remove("menu-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Abrir menú");
          toggle.replaceChildren(icon("menu"));
          refreshIcons();
        };

        toggle.addEventListener("click", () => {
          const isOpen = nav.classList.toggle("is-open");
          document.body.classList.toggle("menu-open", isOpen);
          toggle.setAttribute("aria-expanded", String(isOpen));
          toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
          toggle.replaceChildren(icon(isOpen ? "x" : "menu"));
          refreshIcons();
        });

        navLinks.forEach((link) => link.addEventListener("click", closeMenu));
        document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
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

      function setupSupport() {
        const button = document.getElementById("supportButton");
        const count = document.getElementById("supportCount");
        const countLabel = document.getElementById("supportCountLabel");
        const status = document.getElementById("supportStatus");
        let isSupported = false;

        try { isSupported = window.localStorage.getItem(SUPPORT_STORAGE_KEY) === "1"; } catch { /* El apoyo sigue funcionando en memoria. */ }

        const render = () => {
          count.textContent = isSupported ? "1" : "0";
          countLabel.textContent = isSupported ? "apoyo desde este navegador" : "apoyos desde este navegador";
          button.setAttribute("aria-pressed", String(isSupported));
          button.querySelector("span").textContent = isSupported ? "Quitar mi apoyo" : "Apoyar propuestas";
          button.classList.toggle("is-supported", isSupported);
        };

        render();
        button.addEventListener("click", () => {
          isSupported = !isSupported;
          let saved = true;
          try {
            if (isSupported) window.localStorage.setItem(SUPPORT_STORAGE_KEY, "1");
            else window.localStorage.removeItem(SUPPORT_STORAGE_KEY);
          } catch { saved = false; }
          render();
          count.classList.remove("is-animated");
          void count.offsetWidth;
          count.classList.add("is-animated");
          status.textContent = isSupported
            ? saved ? "Gracias. Tu apoyo quedó guardado en este navegador." : "Gracias. Tu apoyo se muestra solo durante esta visita."
            : "Quitaste tu apoyo de este navegador.";
          status.classList.remove("is-visible");
          requestAnimationFrame(() => status.classList.add("is-visible"));
        });
      }

      function setupForm() {
        const form = document.getElementById("participationForm");
        const comments = document.getElementById("comments");

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const proposal = comments.value.trim();
          if (!proposal) {
            setFormStatus("Escribe una idea breve o usa el botón de apoyo de arriba.", "info");
            comments.focus();
            return;
          }

          try {
            if (navigator.share) {
              await navigator.share({ title: "Propuesta para Chapingo", text: proposal });
              setFormStatus("Tu dispositivo abrió las opciones para compartir. Esta página no recibe el texto.", "success");
              return;
            }
          } catch (error) {
            if (error && error.name === "AbortError") {
              setFormStatus("No se compartió. Tu texto sigue en el campo.", "info");
              return;
            }
          }

          try {
            await navigator.clipboard.writeText(proposal);
            setFormStatus("Propuesta copiada. Pégala en la aplicación donde quieras compartirla.", "success");
          } catch {
            comments.focus();
            comments.select();
            setFormStatus("Seleccionamos el texto; cópialo para compartirlo desde la aplicación que prefieras.", "info");
          }
        });
      }

      function initialize() {
        renderContent();
        setupNavigation();
        setupPrivacyDialog();
        setupSupport();
        setupForm();
        refreshIcons();
        observeReveals();
      }

      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
      else initialize();
    })();
