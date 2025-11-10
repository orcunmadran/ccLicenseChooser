let currentTranslations = {};

const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' }
];

async function changeLanguage(lang) {
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();
    currentTranslations = translations;

    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            // Allow HTML in translations
            element.innerHTML = translations[key];
        }
    });

    // Save language preference
    localStorage.setItem('language', lang);
    // Update html lang attribute
    document.documentElement.lang = lang;
    // Re-calculate license name if choices are already made
    updateLicense();
}

function populateLanguageDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="languageDropdown"]');
    dropdownMenu.innerHTML = ''; // Clear existing static options

    availableLanguages.forEach(lang => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.classList.add('dropdown-item');
        link.href = '#';
        link.textContent = lang.name;
        link.onclick = (e) => {
            e.preventDefault();
            changeLanguage(lang.code);
        };
        listItem.appendChild(link);
        dropdownMenu.appendChild(listItem);
    });
}

// On page load, set the language
document.addEventListener('DOMContentLoaded', async () => {
    populateLanguageDropdown();
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    const savedLang = localStorage.getItem('language');

    // Priority: URL parameter > localStorage > default (en)
    const langToSet = langFromUrl || savedLang || 'en';
    await changeLanguage(langToSet);
});

function updateLicense() {
    const attribution = document.querySelector('input[name="attribution"]:checked')?.value;
    const commercial = document.querySelector('input[name="commercial"]:checked')?.value;
    const derivatives = document.querySelector('input[name="derivatives"]:checked')?.value;

    // Metadata inputs
    const workTitle = document.getElementById('workTitle').value;
    const creatorName = document.getElementById('creatorName').value;
    const workUrl = document.getElementById('workUrl').value;
    const creatorUrl = document.getElementById('creatorUrl').value;
    const creationYear = document.getElementById('creationYear').value;

    const commercialRadios = document.querySelectorAll('input[name="commercial"]');
    const derivativesRadios = document.querySelectorAll('input[name="derivatives"]');

    if (attribution === 'no') {
        // If attribution is 'no', disable other questions as they are irrelevant for CC0
        commercialRadios.forEach(radio => radio.disabled = true);
        derivativesRadios.forEach(radio => radio.disabled = true);
    } else if (attribution === 'yes') {
        // If attribution is 'yes', ensure other questions are enabled
        commercialRadios.forEach(radio => radio.disabled = false);
        derivativesRadios.forEach(radio => radio.disabled = false);
    } else {
        // If attribution is not selected, do nothing and let the placeholder show.
        return;
    }

    // If attribution is 'yes', we need answers for the other two.
    // If attribution is 'no', we can proceed directly.
    if (attribution === 'yes' && (!commercial || !derivatives)) {
        // If not all questions are answered, do nothing and let the placeholder show.
        return;
    }


    let license = '';
    let licenseNameKey = '';
    let licenseUrl = '';
    let icons = [];

    if (attribution === 'no') {
        license = 'CC0';
        licenseNameKey = 'licenseNameCC0';
    } else { // attribution === 'yes'        
        if (derivatives === 'yes') {
            license = 'CC BY';
            licenseNameKey = 'licenseNameBY';
            icons = ['by'];
            if (commercial === 'no') {
                license += '-NC';
                licenseNameKey = 'licenseNameBYNC';
                icons.push('nc');
            }
        } else if (derivatives === 'sa') {
            license = 'CC BY-SA';
            licenseNameKey = 'licenseNameBYSA';
            icons = ['by', 'sa'];
            if (commercial === 'no') {
                license = 'CC BY-NC-SA';
                licenseNameKey = 'licenseNameBYNCSA';
                icons.push('nc');
            }
        } else if (derivatives === 'no') {
            license = 'CC BY-ND';
            licenseNameKey = 'licenseNameBYND';
            icons = ['by', 'nd'];
            if (commercial === 'no') {
                license = 'CC BY-NC-ND';
                licenseNameKey = 'licenseNameBYNCND';
                icons.push('nc');
            }
        }
    }

    // Construct the URL for the license deed
    if (license) {
        const lang = document.documentElement.lang || 'tr';
        // For non-English, CC site uses deed.{lang_code}
        const deed = lang === 'en' ? '' : `deed.${lang}`;

        if (license === 'CC0') {
            licenseUrl = `https://creativecommons.org/publicdomain/zero/1.0/${deed}`;
        } else {
            const licenseCode = license.replace('CC ', '').toLowerCase(); // "CC BY-SA" -> "by-sa"
            licenseUrl = `https://creativecommons.org/licenses/${licenseCode}/4.0/${deed}`;
        }
        // Clean up trailing slash if deed is empty for a cleaner URL
        if (licenseUrl.endsWith('/')) {
            licenseUrl = licenseUrl.slice(0, -1);
        }
    }

    // Show metadata section
    document.getElementById('resetButton').style.display = 'block'; // Show reset button once a license is determined
    document.getElementById('metadataSection').style.display = 'block';
    document.getElementById('copyButton').style.display = 'block';

    // --- Generate HTML and Text Notices ---

    const byText = currentTranslations['attributionBy'] || ' by ';
    const licensedUnderText = currentTranslations['isLicensedUnder'] || ' is licensed under ';
    const fallbackWorkTitle = currentTranslations['fallbackWorkTitle'] || 'This work';
    const fallbackCreatorName = currentTranslations['fallbackCreatorName'] || 'the author';

    let workLink = workTitle || fallbackWorkTitle;
    if (workUrl && workTitle) {
        workLink = `<a href="${workUrl}" rel="noopener noreferrer" target="_blank">${workTitle}</a>`;
    }

    const licenseLink = `<a href="${licenseUrl}" rel="noopener noreferrer" target="_blank">${license}</a>`;

    const iconHTML = icons.map(icon => `<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/${icon}.svg?ref=chooser-v1" alt="${icon}">`).join('');

    let attributionTextHTML = '';
    let htmlToCopy = '';
    const currentLang = document.documentElement.lang;

    if (currentLang === 'tr') {
        // Turkish sentence structure: "[Eser Adı]" ([Yıl]), [Eser Sahibi] tarafından [Lisans Kodu] ile lisanslanmıştır.
        const yearText = creationYear ? ` (${creationYear})` : '';
        let creatorPart = '';
        if (creatorName) {
            let creatorTag = creatorUrl ? `<a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="${creatorUrl}">${creatorName}</a>` : `<span property="cc:attributionName">${creatorName}</span>`;
            creatorPart = `, ${creatorTag} ${byText}`;
        }
        attributionTextHTML = `${workLink}${yearText}${creatorPart} ${licenseLink} ${licensedUnderText}`;
        htmlToCopy = `<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="${workUrl || '#'}">${workTitle || fallbackWorkTitle}</a>${yearText}${creatorPart} ${licenseLink} ${licensedUnderText}</p>`;
    } else {
        // Default English sentence structure: "[Work]" by [Creator] is licensed under [License].
        const yearText = creationYear ? ` © ${creationYear}` : '';
        let creatorLink = creatorName ? `${byText}${creatorName}` : '';
        if (creatorUrl && creatorName) {
            creatorLink = `${byText}<a href="${creatorUrl}" rel="noopener noreferrer" target="_blank">${creatorName}</a>`;
        } else if (creatorUrl && !creatorName) {
            creatorLink = `${byText}<a href="${creatorUrl}" rel="noopener noreferrer" target="_blank">${creatorUrl}</a>`;
        }
        attributionTextHTML = `${workLink}${yearText}${creatorLink} ${licensedUnderText} ${licenseLink}.`;
        htmlToCopy = `<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="${workUrl || '#'}">${workTitle || fallbackWorkTitle}</a>${creatorLink}${licensedUnderText}<a href="${licenseUrl}" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">${license}${iconHTML}</a></p>`;
    }


    // Final HTML for the main result box
    const licenseName = currentTranslations[licenseNameKey] || '';
    const linkText = currentTranslations['licenseLinkText'] || 'View Details';
    const resultHTML = `
        <div>${iconHTML}</div>
        <h3 class="mt-2">${license}</h3>
        <p class="lead">${licenseName}</p>
        <p><small>${attributionTextHTML}</small></p>
        <a href="${licenseUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-2">${linkText}</a>
    `;
    document.getElementById('licenseResult').innerHTML = resultHTML;

    // Final HTML for the copyable code box
    document.getElementById('htmlResult').innerHTML = `<textarea id="htmlToCopy" class="form-control" rows="5" readonly>${htmlToCopy}</textarea>`;
}

function copyHtml() {
    const textarea = document.getElementById('htmlToCopy');
    if (!textarea) return;

    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        const copyButton = document.getElementById('copyButton');
        const originalText = currentTranslations['copyButton'] || 'Copy';
        const copiedText = currentTranslations['copiedButton'] || 'Copied!';
        
        copyButton.textContent = copiedText;
        copyButton.classList.remove('btn-secondary');
        copyButton.classList.add('btn-success');

        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('btn-success');
            copyButton.classList.add('btn-secondary');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Add event listeners to all radio buttons
document.querySelectorAll('input[type="radio"]').forEach(radio => radio.addEventListener('change', updateLicense));

// Add event listeners to metadata inputs
document.getElementById('workTitle').addEventListener('input', updateLicense);
document.getElementById('creatorName').addEventListener('input', updateLicense);
document.getElementById('workUrl').addEventListener('input', updateLicense);
document.getElementById('creatorUrl').addEventListener('input', updateLicense);
document.getElementById('creationYear').addEventListener('input', updateLicense);

// Add event listener for the copy button
document.getElementById('copyButton').addEventListener('click', copyHtml);

function resetForm() {
    // 1. Uncheck all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // 2. Clear metadata form inputs
    document.getElementById('workTitle').value = '';
    document.getElementById('creatorName').value = '';
    document.getElementById('workUrl').value = '';
    document.getElementById('creatorUrl').value = '';
    document.getElementById('creationYear').value = '';

    // 3. Hide the right-side sections
    document.getElementById('metadataSection').style.display = 'none';
    document.getElementById('copyButton').style.display = 'none';
    document.getElementById('resetButton').style.display = 'none'; // Hide reset button

    // 4. Reset the license result area to its initial state
    const placeholderText = currentTranslations['noLicenseSelected'] || 'License features not yet determined.';
    document.getElementById('licenseResult').innerHTML = `<p class="text-muted fst-italic">${placeholderText}</p>`;

    // 5. Re-enable all radio buttons that might have been disabled
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = false);
}

// Add event listener for the reset button
document.getElementById('resetButton').addEventListener('click', resetForm);