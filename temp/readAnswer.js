const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('DAPAN.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
    const results = extractAnswers(data.text);
    saveResultsToFile(results);
});

function extractAnswers(text) {
    const sections = text.split('KỸ NĂNG:');
    let results = [];

    sections.forEach(section => {
        if (section.trim() !== '') {
            const lines = section.split('\n');
            const sectionType = lines[0].trim(); // Lấy loại kỹ năng
            let type;
            const answers = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line !== '') {
                    const parts = line.split('.');
                    if (parts.length > 1) {
                        answers.push(parts[1].trim());
                    }
                }
            }
            if (sectionType === 'NGHE HIỂU') {
              type = 'listening'
            }
            if (sectionType === 'ĐỌC HIỂU') {
              type = 'reading'
            }
            if (sectionType === 'VIẾT') {
                type = 'writing'
            }
            
            results.push({
                sectionType: type,
                results: answers
            });
        }
    });

    return results;
}

function saveResultsToFile(results) {
    fs.writeFileSync('output.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('Results saved to output.json');
}
