document.addEventListener("DOMContentLoaded", function () {
  const agendaSection = document.getElementById("agendaSection");
  const caixaSection = document.getElementById("caixaSection");
  const usuariosSection = document.getElementById("usuariosSection");

  const agendamentosLink = document.querySelector('a[href="#agenda"]');
  const caixaLink = document.querySelector('a[href="#caixa"]');
  const usuariosLink = document.querySelector('a[href="#usuarios"]');

  function hideAllSections() {
    agendaSection.style.display = "none";
    caixaSection.style.display = "none";
    usuariosSection.style.display = "none";
  }

  agendamentosLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    agendaSection.style.display = "block";
  });

  caixaLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    caixaSection.style.display = "block";
  });

  usuariosLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    usuariosSection.style.display = "block";
    fetchUsers();
  });

  const userNameDisplay = document.getElementById("userNameDisplay");
  const userName = localStorage.getItem("userName");
  if (userNameDisplay) {
    userNameDisplay.innerText = userName ? `Bem-vindo, ${userName}!` : "";
  }

  const barberNameMap = {
    "Erik": "barber_1",
    "Alesson": "barber_2"
  };

  const fetchAppointmentsBtn = document.getElementById("fetchAppointmentsBtn");
  const barberSelect = document.getElementById("barberSelect");
  const appointmentsList = document.getElementById("appointmentsList");

  let allAppointments = [];

  if (fetchAppointmentsBtn) {
    fetchAppointmentsBtn.addEventListener("click", function () {
      const displayName = barberSelect.value;
      fetchAppointments(displayName);
    });
  }

  function fetchAppointments(displayName) {
    const apiName = barberNameMap[displayName];
    if (!apiName) return;

    fetch(`https://kinkbarbearia.pythonanywhere.com/appointments?barber=${encodeURIComponent(apiName)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.appointments) {
          const formattedAppointments = data.appointments.map((appointment) => ({
            ...appointment,
            barber: displayName
          }));
          allAppointments = formattedAppointments; // sobrescreve corretamente
          filterAppointments();
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar agendamentos:", error);
      });
  }

  function filterAppointments() {
    const selectedBarber = barberSelect.value;
    const filteredAppointments = allAppointments.filter(
      (appointment) => appointment.barber === selectedBarber
    );

    if (appointmentsList) {
      appointmentsList.innerHTML = "";

      if (filteredAppointments.length > 0) {
        filteredAppointments.forEach((appointment) => {
          const appointmentElement = document.createElement("div");
          appointmentElement.innerHTML = `
            <h3>${appointment.service}</h3>
            <p><strong>Barbeiro:</strong> ${appointment.barber}</p>
            <p><strong>Data:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Horário:</strong> ${appointment.time}</p>
            <p><strong>Duração:</strong> ${appointment.duration} minutos</p>
            <p><strong>Valor: R$</strong> ${appointment.value},00</p>
            <p><strong>Email:</strong> ${appointment.client_email}</p>
            <p><strong>Telefone:</strong> 
              <a href="${generateWhatsAppLink(appointment.client_phone, appointment.date, appointment.time)}"
                 target="_blank"
                 style="text-decoration: none; color: #0d6efd; display: inline-flex; align-items: center; gap: 6px;">
                <img src="./img/whatsapp.png" alt="WhatsApp" width="20" height="20" />
                ${appointment.client_phone}
              </a>
            </p>
            <div id="ico-atl">
              <img id="confirm" src="./img/verifica.png" alt="Confirmar" onclick="confirmAppointment(${appointment.id}, this)">
              <img id="exclude" src="./img/excluir.png" alt="Excluir" onclick="deleteAppointment(${appointment.id}, this)">
            </div>
            <hr/>
          `;
          appointmentsList.appendChild(appointmentElement);
        });
      } else {
        appointmentsList.innerHTML = "<p>Não há agendamentos para este barbeiro.</p>";
      }
    }
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  function generateWhatsAppLink(phone, date, time) {
    const cleanPhone = phone.replace(/\D/g, ""); // Remove não numéricos
    const brazilPhone = `55${cleanPhone}`;

    const formattedDate = formatDate(date);

    const message =
      "Olá, bom dia! Tudo certo? 😊\n" +
      "Passando só pra confirmar o seu horário na Domini Henry Barbearia.\n\n" +
      "📅 *Data:* " + formattedDate + " às " + time + "\n" +
      "📍 *Endereço:* Rua Flores de São Pedro 27.\n\n" +
      "Se estiver tudo certo, só responder com “Confirmado”.\n" +
      "Caso precise remarcar ou tiver algum imprevisto, é só avisar com antecedência.\n\n" +
      "Estamos te esperando! 💈✂️\n" +
      "Abraço, equipe Domini Henry Barbearia.";

    const encodedMessage = encodeURIComponent(message);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Link direto para app do WhatsApp mobile
      return `whatsapp://send?phone=${brazilPhone}&text=${encodedMessage}`;
    } else {
      // Link padrão que abre o WhatsApp Web
      return `https://wa.me/${brazilPhone}?text=${encodedMessage}`;
    }
  }



  if (barberSelect) {
    barberSelect.addEventListener("change", filterAppointments);
  }

  window.confirmAppointment = function (appointmentId, element) {
    const selectedBarberName = barberSelect.value;
    const barberCode = barberNameMap[selectedBarberName];

    const appointment = allAppointments.find(
      (app) => app.id === appointmentId && app.barber === selectedBarberName
    );

    if (!appointment) {
      console.error("Agendamento não encontrado.");
      return;
    }

    const confirmedElement = document.createElement("p");
    confirmedElement.innerText = "Atendimento realizado";
    confirmedElement.style.color = "green";

    const appointmentElement = element.closest("div").parentElement;
    appointmentElement.appendChild(confirmedElement);

    fetch("https://kinkbarbearia.pythonanywhere.com/caixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barber_name: barberCode,
        service: appointment.service,
        value: appointment.value,
        date: appointment.date,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        return fetch(
          `https://kinkbarbearia.pythonanywhere.com/appointments/${appointmentId}?barber=${encodeURIComponent(barberCode)}`,
          { method: "DELETE" }
        );
      })
      .then((response) => response.json())
      .then(() => {
        allAppointments = allAppointments.filter((app) => app.id !== appointmentId);
        filterAppointments();
      })
      .catch((error) => {
        console.error("Erro ao registrar ou deletar:", error);
      });

    element.style.pointerEvents = "none";
  };

  // Formatação de data para exibição no resultado
  function formatDateForUser(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Manipulação do envio do formulário de consulta ao caixa
  const caixaForm = document.getElementById("caixaForm");

  const barberMap = {
    barber_1: "Erik",
    barber_2: "Alesson", // adicionar quando necessário
  };

  if (caixaForm) {
    caixaForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const selectedDate = document.getElementById("caixaDate").value;
      const selectedBarberLabel = document.getElementById("barberCaixaSelect").value;
      const caixaResult = document.getElementById("caixaResult");

      if (!selectedDate || !selectedBarberLabel || !caixaResult) return;

      caixaResult.innerHTML = `
      <div class="text-center my-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mt-2">Buscando dados do caixa...</p>
      </div>
    `;

      const formattedDateForUser = formatDateForUser(selectedDate);

      fetch(`https://kinkbarbearia.pythonanywhere.com/caixa?date=${encodeURIComponent(selectedDate)}`)
        .then((response) => response.json())
        .then((data) => {
          if (!Array.isArray(data)) {
            throw new Error("Resposta inválida do servidor");
          }

          // traduz barber_name técnico para nome amigável
          const translatedData = data.map(item => ({
            ...item,
            friendly_name: barberMap[item.barber_name] || item.barber_name
          }));

          // filtra baseado na seleção
          const filteredData = selectedBarberLabel === "Todos"
            ? translatedData
            : translatedData.filter(item => item.friendly_name === selectedBarberLabel);

          if (filteredData.length === 0) {
            caixaResult.innerHTML = `
            <div class="alert alert-warning mt-3" role="alert">
              Nenhum registro encontrado para <strong>${selectedBarberLabel}</strong> em <strong>${formattedDateForUser}</strong>.
            </div>
          `;
            return;
          }

          if (selectedBarberLabel === "Todos") {
            let total = 0;
            let breakdown = "";

            filteredData.forEach((barber) => {
              total += parseFloat(barber.total_cash.replace("R$ ", "").replace(",", "."));
              breakdown += `<li>${barber.friendly_name}: ${barber.total_cash}</li>`;
            });

            caixaResult.innerHTML = `
            <div class="alert alert-success mt-3" role="alert">
              <h5 class="alert-heading">Caixa Total de Todos os Barbeiros</h5>
              <p><strong>Data:</strong> ${formattedDateForUser}</p>
              <p><strong>Valor Total:</strong> R$ ${total.toFixed(2)}</p>
              <hr>
              <ul>${breakdown}</ul>
            </div>
          `;
          } else {
            const barber = filteredData[0];
            caixaResult.innerHTML = `
            <div class="alert alert-success mt-3" role="alert">
              <h5 class="alert-heading">Caixa de ${barber.friendly_name}</h5>
              <p><strong>Data:</strong> ${formattedDateForUser}</p>
              <p><strong>Valor Total:</strong> ${barber.total_cash}</p>
            </div>
          `;
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar dados do caixa:", error);
          caixaResult.innerHTML = `
          <div class="alert alert-danger mt-3" role="alert">
            Erro ao buscar os dados. Tente novamente.
          </div>
        `;
        });
    });
  }

  function formatDateForUser(dateStr) {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }


  //excluir (função global, mas movida para escopo correto)
  window.deleteAppointment = function (appointmentId, element) { // Tornada global para `onclick`
    const selectedBarber = barberSelect.value; // `barberSelect` precisa ser acessível

    fetch(
      `https://kinkbarbearia.pythonanywhere.com/appointments/${appointmentId}?barber=${encodeURIComponent(
        selectedBarber
      )}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => {
        if (response.ok) {
          // Remove o elemento da tela se a exclusão for bem-sucedida
          const appointmentElement = element.closest("div").parentElement;
          appointmentElement.remove();
          console.log("Agendamento excluído com sucesso.");
          // Atualiza a lista localmente também
          allAppointments = allAppointments.filter((app) => app.id !== appointmentId);
          filterAppointments();
        } else {
          return response.json().then((data) => {
            throw new Error(data.error || "Erro ao excluir o agendamento.");
          });
        }
      })
      .catch((error) => {
        console.error("Erro ao excluir o agendamento:", error);
      });
  }

  //consultar usuarios (já no escopo principal do DOMContentLoaded)
  // document.getElementById("usuariosLink").addEventListener("click", function () { // Já definido acima como `usuariosLink`
  //   document.getElementById("agendaSection").style.display = "none";
  //   document.getElementById("caixaSection").style.display = "none";
  //   document.getElementById("usuariosSection").style.display = "block";
  //   fetchUsers(); // Chama a função para buscar e exibir os usuários
  // });

  function fetchUsers() {
    fetch("https://kinkbarbearia.pythonanywhere.com/users")
      .then((response) => response.json())
      .then((data) => {
        const usuariosList = document.getElementById("usuariosList"); // Assumindo que você tem um ul/div com este ID
        if (usuariosList) {
          usuariosList.innerHTML = "";

          data.forEach((user) => {
            const li = document.createElement("li");
            li.className = "list-group-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "user-name";
            nameSpan.textContent = user.name;

            const phoneSpan = document.createElement("span");
            phoneSpan.className = "user-phone";
            phoneSpan.textContent = `  ${user.phone}`;

            const br = document.createElement("br");

            const emailSpan = document.createElement("span");
            emailSpan.className = "user-email";
            emailSpan.textContent = `  ${user.email}`;

            li.appendChild(nameSpan);
            li.appendChild(phoneSpan);
            li.appendChild(br); // Adiciona a quebra de linha
            li.appendChild(emailSpan);

            usuariosList.appendChild(li);
          });
        }
      })
      .catch((error) => console.error("Erro ao buscar usuários:", error));
  }

  const nomeClienteInput = document.getElementById("nomeCliente"); // Assumindo que você tem um input com este ID
  if (nomeClienteInput) {
    nomeClienteInput.addEventListener("keyup", filterUsers); // Adiciona listener para filtrar ao digitar
  }

  function filterUsers() {
    const input = document.getElementById("nomeCliente").value.toUpperCase();
    const users = document.querySelectorAll("#usuariosList li");

    users.forEach((user) => {
      if (user.textContent.toUpperCase().includes(input)) {
        user.style.display = "";
      } else {
        user.style.display = "none";
      }
    });
  }
});