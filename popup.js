document.getElementById('btnFiltrar').addEventListener('click', () => {
    const prefijo = document.getElementById('prefijo').value.trim();

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'filtrar',
            prefijo
        });
    });
});

document.getElementById('btnReset').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'reset'
        });
    });
});
