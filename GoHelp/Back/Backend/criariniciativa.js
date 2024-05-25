document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const userProfileImage = userData.profileImage || userData.imageUrl;
    const userEmail = userData.email; // Assuming you have the user's email in the userData
    document.getElementById("user-profile-image-navbar").src = userProfileImage;
  
    // Preencher dropdown de materiais
    const materialDropdown = document.querySelector(".material-dropdown");
    const materials = JSON.parse(localStorage.getItem("materials")) || [];
    materials.forEach((material) => {
      const option = document.createElement("option");
      option.value = material.id;
      option.textContent = material.nome;
      materialDropdown.appendChild(option);
    });
    const addMaterialButton = document.querySelector(".add-material-button");
    addMaterialButton.addEventListener("click", function () {
        const materialTemplate = document.querySelector(".material-row");
        const newMaterial = materialTemplate.cloneNode(true);
    
        newMaterial.querySelector(".material-dropdown").value = "Selecionar Material...";
        
        const materialsContainer = document.querySelector(".materials-container");
        materialsContainer.appendChild(newMaterial);
    });
  
    // Preencher dropdown de profissionais
    const profissionalDropdown = document.querySelector(".profissional-dropdown");
    const profissionais = JSON.parse(localStorage.getItem("profissionais")) || [];
    profissionais.forEach((profissional) => {
      const option = document.createElement("option");
      option.value = profissional.nome; // ou outro identificador único
      option.textContent = profissional.nome;
      profissionalDropdown.appendChild(option);
    });
    const addProfessionalButton = document.querySelector(".add-professional-button");
    addProfessionalButton.addEventListener("click", function () {
        // Clone do modelo do profissional
        const professionalTemplate = document.querySelector(".profissional-row");
        const newProfessional = professionalTemplate.cloneNode(true);
        
        // Limpar o valor da seleção
        newProfessional.querySelector(".profissional-dropdown").value = "Selecionar Profissional...";
        
        // Adicionar o novo profissional ao formulário
        const professionalContainer = document.querySelector(".profissional-container");
        professionalContainer.appendChild(newProfessional);
    });
  
    const form = document.querySelector(".forms-sample");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
  
      const formData = new FormData(form);
      const serializedData = {};
      for (const [key, value] of formData.entries()) {
        serializedData[key] = value;
      }
  
      // Salvar dados em localStorage
      saveDataToLocalStorage(serializedData);
    });
  });
  
  function saveDataToLocalStorage(data) {
    if (typeof localStorage !== "undefined") {
      try {
        const existingInitiatives = JSON.parse(localStorage.getItem("initiatives")) || [];
        const userData = JSON.parse(localStorage.getItem("userData"));
        const userEmail = userData.email;
        const locationError = document.getElementById("locationError");
  
        // Longitude e latitude para a iniciativa
        geocodeLocation(data["iniciativa-location"], function (coordinates, status) {
          if (status === "OK") {
            // Criar nova iniciativa
            const newInitiative = {
              id: generateUniqueId(),
              type: data["TipoIniciativa"],
              name: data["iniciativa-title"],
              volunteers: data["volunteers"],
              location: data["iniciativa-location"],
              latitude: coordinates.lat,
              longitude: coordinates.lng,
              date: data["iniciativa-date"],
              start_hour: data["start-hour"],
              end_hour: data["end-hour"],
              description: data["iniciativa-description"],
              comments: data["iniciativa-comments"],
              materials: data["materials"],
              professionals: data["profissionais"],
              status: "Por realizar",
              userEmail: userEmail,
              associatedVolunteers: [userEmail],
            };
            existingInitiatives.push(newInitiative);
  
            localStorage.setItem("initiatives", JSON.stringify(existingInitiatives));
  
            const successModal = new bootstrap.Modal(document.getElementById("successModal"));
            successModal.show();
  
            form.reset();
            clearAndRestoreFormInputs(form);
            locationError.innerText = "";
          } else {
            const unsuccessModal = new bootstrap.Modal(document.getElementById("unsuccessModal"));
            unsuccessModal.show();
  
            locationError.innerText = "Localização inválida. Por favor insira outra localização e submeta novamente.";
          }
        });
      } catch (error) {
        console.error("Error saving data to localStorage:", error);
      }
    } else {
      console.error("localStorage não é suportada neste browser");
    }
  }
  
  // Gerar longitude e latitude para por o pin no mapa
  function geocodeLocation(location, callback) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': location }, function (results, status) {
      if (status === 'OK') {
        const coordinates = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        callback(coordinates, 'OK');
      } else {
        console.error('Geocode was not successful for the following reason:', status);
        callback(null, status);
      }
    });
  }
  
  // Validar duração da iniciativa
  function validateHour() {
    const tipoIniciativa = document.querySelector('input[name="TipoIniciativa"]:checked').value;
    const startHour = parseInt(document.getElementById("start-hour").value.split(':')[0]);
    const startMinute = parseInt(document.getElementById("start-hour").value.split(':')[1]);
    const endHour = parseInt(document.getElementById("end-hour").value.split(':')[0]);
    const endMinute = parseInt(document.getElementById("end-hour").value.split(':')[1]);
  
    const durationHours = endHour - startHour;
    const durationMinutes = endMinute - startMinute;
  
    let timeError = document.getElementById("timeError");
  
    switch (tipoIniciativa) {
      case 'Limpeza':
      case 'Reflorestação':
        if (durationHours > 4 || (durationHours === 4 && durationMinutes > 0)) {
          timeError.innerText = "A duração excede o tempo limite para este tipo de iniciativa";
          return false;
        } else {
          timeError.innerText = "";
        }
        break;
      case 'Campanhas':
        if (durationHours > 1 || (durationHours === 1 && durationMinutes > 0)) {
          timeError.innerText = "A duração excede o tempo limite para este tipo de iniciativa";
          return false;
        } else {
          timeError.innerText = "";
        }
        break;
      default:
        timeError.innerText = "";
        break;
    }
  
    return true;
  }
  
  // Validar data
  function validateDate() {
    const iniciativaDate = new Date(document.getElementById("iniciativa-date").value);
    const today = new Date();
    if (iniciativaDate <= today) {
      document.getElementById("dateError").innerText = "A data deve ser no futuro.";
      return false;
    }
    document.getElementById("dateError").innerText = "";
    return true;
  }
  
  function submitForm() {
    if (!validateDate() || !validateHour()) {
      alert("Por favor selecione uma data e/ou hora no futuro.");
    }
  }
  
  // Apagar os campos e restaurar os placeholders
  function clearAndRestoreFormInputs(form) {
    form.querySelectorAll('input, textarea').forEach(input => {
      input.value = '';
      input.setAttribute('placeholder', input.dataset.placeholder);
    });
    document.getElementById("volunteersInput").value = 1;
  }
  
  // Guardar os placeholders quando carrega a página
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.forms-sample');
    form.querySelectorAll('input, textarea').forEach(input => {
      input.dataset.placeholder = input.getAttribute('placeholder');
    });
  });
  