export function loadCsv(path, transformRow, onData, onError, Papa) {
    fetch(path)
        .then(function (response) { return response.text(); })
        .then(function (text) {
            const result = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
            const rows = [];
            for (let i = 0; i < result.data.length; i++) {
                const row = transformRow(result.data[i]);
                if (row) rows.push(row);
            }
            onData(rows);
        })
        .catch(function (error) {
            onError(error);
            onData([]);
        });
}
