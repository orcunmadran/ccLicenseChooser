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
            element.innerHTML = translations[key];
        }
    });

    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    updateLicense();
}

function populateLanguageDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="languageDropdown"]');
    dropdownMenu.innerHTML = '';

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

document.addEventListener('DOMContentLoaded', async () => {
    populateLanguageDropdown();
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    const savedLang = localStorage.getItem('language');

    const langToSet = langFromUrl || savedLang || 'en';
    await changeLanguage(langToSet);
});

function updateLicense() {
    const attribution = document.querySelector('input[name="attribution"]:checked')?.value;
    const commercial = document.querySelector('input[name="commercial"]:checked')?.value;
    const derivatives = document.querySelector('input[name="derivatives"]:checked')?.value;

    document.getElementById('step1').querySelector('.step-number').classList.toggle('completed', !!attribution);
    document.getElementById('step2').querySelector('.step-number').classList.toggle('completed', !!commercial || attribution === 'no');
    document.getElementById('step3').querySelector('.step-number').classList.toggle('completed', !!derivatives || attribution === 'no');

    if (!attribution) {
        return;
    }

    const workTitle = document.getElementById('workTitle').value;
    const creatorName = document.getElementById('creatorName').value;
    const workUrl = document.getElementById('workUrl').value;
    const creatorUrl = document.getElementById('creatorUrl').value;
    const creationYear = document.getElementById('creationYear').value;

    const commercialRadios = document.querySelectorAll('input[name="commercial"]');
    const derivativesRadios = document.querySelectorAll('input[name="derivatives"]');

    if (attribution === 'no') {
        commercialRadios.forEach(radio => radio.disabled = true);
        derivativesRadios.forEach(radio => radio.disabled = true);
    } else if (attribution === 'yes') {
        commercialRadios.forEach(radio => radio.disabled = false);
        derivativesRadios.forEach(radio => radio.disabled = false);
    } else { 
        document.getElementById('resetButton').style.display = 'none';
        document.getElementById('metadataSection').style.display = 'none';
        return;
    }

    if (attribution === 'yes' && (!commercial || !derivatives)) {
        document.getElementById('resetButton').style.display = 'block';
        document.getElementById('metadataSection').style.display = 'none';
        return;
    }
    let license = '';
    let licenseNameKey = '';
    let licenseUrl = '';
    let icons = [];

    if (attribution === 'no') {
        license = 'CC0';
        licenseNameKey = 'licenseNameCC0';
    } else {       
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

    if (license) {
        const lang = document.documentElement.lang || 'tr';
        const deed = lang === 'en' ? '' : `deed.${lang}`;

        if (license === 'CC0') {
            licenseUrl = `https://creativecommons.org/publicdomain/zero/1.0/${deed}`;
        } else {
            const licenseCode = license.replace('CC ', '').toLowerCase();
            licenseUrl = `https://creativecommons.org/licenses/${licenseCode}/4.0/${deed}`;
        }
        if (licenseUrl.endsWith('/')) {
            licenseUrl = licenseUrl.slice(0, -1);
        }
    }

    document.getElementById('resetButton').style.display = 'block';
    document.getElementById('metadataSection').style.display = 'block';
    document.getElementById('copyButton').style.display = 'block';

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
        const yearText = creationYear ? ` (${creationYear})` : '';
        let creatorPart = '';
        if (creatorName) {
            let creatorTag = creatorUrl ? `<a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="${creatorUrl}">${creatorName}</a>` : `<span property="cc:attributionName">${creatorName}</span>`;
            creatorPart = `, ${creatorTag} ${byText}`;
        }
        attributionTextHTML = `${workLink}${yearText}${creatorPart} ${licenseLink} ${licensedUnderText}`;
        htmlToCopy = `<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="${workUrl || '#'}">${workTitle || fallbackWorkTitle}</a>${yearText}${creatorPart} ${licenseLink} ${licensedUnderText}</p>`;
    } else {
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

document.querySelectorAll('input[type="radio"]').forEach(radio => radio.addEventListener('change', updateLicense));

document.getElementById('workTitle').addEventListener('input', updateLicense);
document.getElementById('creatorName').addEventListener('input', updateLicense);
document.getElementById('workUrl').addEventListener('input', updateLicense);
document.getElementById('creatorUrl').addEventListener('input', updateLicense);
document.getElementById('creationYear').addEventListener('input', updateLicense);

document.getElementById('copyButton').addEventListener('click', copyHtml);

function resetForm() {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    document.getElementById('workTitle').value = '';
    document.getElementById('creatorName').value = '';
    document.getElementById('workUrl').value = '';
    document.getElementById('creatorUrl').value = '';
    document.getElementById('creationYear').value = '';

    document.getElementById('metadataSection').style.display = 'none';
    document.getElementById('copyButton').style.display = 'none';
    document.getElementById('resetButton').style.display = 'none'; 

    const placeholderText = currentTranslations['noLicenseSelected'] || 'License features not yet determined.';
    document.getElementById('licenseResult').innerHTML = `<p class="text-muted fst-italic">${placeholderText}</p>`;

    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = false);

    document.getElementById('step1').querySelector('.step-number').classList.remove('completed');
    document.getElementById('step2').querySelector('.step-number').classList.remove('completed');
    document.getElementById('step3').querySelector('.step-number').classList.remove('completed');
}

document.getElementById('resetButton').addEventListener('click', resetForm);