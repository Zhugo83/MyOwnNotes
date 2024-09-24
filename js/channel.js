document.addEventListener('DOMContentLoaded', () => {
    const visibilitySelect = document.getElementById('visibility');
    const shareLink1 = document.getElementById('shareLink1');
    const shareLink2 = document.getElementById('shareLink2');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const generatePasswordBtn = document.getElementById('generatePassword');
    const togglePasswordBtn2 = document.getElementById('togglePassword2');
    const generatePasswordBtn2 = document.getElementById('generatePassword2');
    const passwordmodificationInput = document.getElementById('passwordmodification');
    const passwordvisibilityInput = document.getElementById('passwordvisibility');
    let sidebarVisible = true;

    const generateRandomPassword = (minLength, maxLength) => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        // Generate a random length between minLength and maxLength (inclusive)
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    };

    const generateShareLinks = () => {
        const baseUrl = window.location.href; // Assuming this is the channel URL
        
        let modPassword = passwordmodificationInput.value;
        let viewPassword = passwordvisibilityInput.value;

        let link1, link2;
        if (visibilitySelect.value === 'public') {
            link1 = `${baseUrl}`; // Fix: Use backticks for template literals
            link2 = `${baseUrl}?modificationPassword=${modPassword}`; // Fix: Use backticks for template literals
        } else if (visibilitySelect.value === 'private') {
            link1 = `${baseUrl}?visibilityPassword=${viewPassword}`; // Fix: Use backticks for template literals
            link2 = `${baseUrl}?modificationPassword=${modPassword}&visibilityPassword=${viewPassword}`; // Fix: Use backticks for template literals
        }

        shareLink1.setAttribute('data-link', link1);
        shareLink1.textContent = 'Share Link 1';
        shareLink2.setAttribute('data-link', link2);
        shareLink2.textContent = 'Share Link 2';
    };

    const copyToClipboard = (text) => {
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = text;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Link copied to clipboard!');
    };

    shareLink1.addEventListener('click', () => {
        if (visibilitySelect.value === 'private') {
            alert('For the private visibility, you need to add a password');
            return;
        }
        generateShareLinks()
        const link = shareLink1.getAttribute('data-link');
        copyToClipboard(link);
    });

    shareLink2.addEventListener('click', () => {
        generateShareLinks()
        const link = shareLink2.getAttribute('data-link');
        copyToClipboard(link);
    });

    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.style.display = sidebarVisible ? 'none' : 'flex';
        toggleSidebarBtn.className = sidebarVisible ? 'fas fa-arrow-right' : 'fas fa-arrow-left';
        sidebarVisible = !sidebarVisible;
    });

    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordmodificationInput.type === 'password' ? 'text' : 'password';
        passwordmodificationInput.type = type;
        togglePasswordBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    generatePasswordBtn.addEventListener('click', () => {
        const randomPassword = generateRandomPassword(10, 16);
        passwordmodificationInput.value = randomPassword;
    });

    togglePasswordBtn2.addEventListener('click', () => {
        const type = passwordvisibilityInput.type === 'password' ? 'text' : 'password';
        passwordvisibilityInput.type = type;
        togglePasswordBtn2.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    generatePasswordBtn2.addEventListener('click', () => {
        const randomPassword = generateRandomPassword(10, 16);
        passwordvisibilityInput.value = randomPassword;
    });

    const secondPasswordContainer = document.getElementById('secondPasswordContainer');

    // Function to toggle second password field based on visibility value
    const toggleSecondPasswordField = () => {
        if (visibilitySelect.value === 'private') {
            secondPasswordContainer.style.display = 'block'; // Show second password field
        } else {
            secondPasswordContainer.style.display = 'none'; // Hide second password field
        }
    };

    // Run the toggle function on page load to set the initial state
    toggleSecondPasswordField();

    // Add event listener for when the visibility changes
    visibilitySelect.addEventListener('change', toggleSecondPasswordField);
});   