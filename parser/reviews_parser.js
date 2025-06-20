// Парсер отзывов для Яндекс.Карт
function parseReviews(maxReviews = 10) {
    const reviews = [];
    
    // Функция для получения даты в нужном формате
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    }
    
    // Функция для скроллинга страницы
    function scrollToBottom() {
        return new Promise((resolve) => {
            const scrollHeight = document.documentElement.scrollHeight;
            window.scrollTo(0, scrollHeight);
            setTimeout(resolve, 2000); // Ждем 2 секунды для загрузки контента
        });
    }
    
    // Функция для сохранения в XLSX
    function saveToXLSX(reviews) {
        // Создаем HTML таблицу
        let table = '<table>';
        
        // Добавляем заголовки
        table += '<tr><th>Дата</th><th>Время сбора</th><th>Оценка</th><th>Отзыв</th></tr>';
        
        // Добавляем данные
        reviews.forEach(review => {
            table += `<tr>
                <td>${review.date}</td>
                <td>${review.time}</td>
                <td>${review.rating}</td>
                <td>${review.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>`;
        });
        
        table += '</table>';
        
        // Создаем HTML документ с таблицей
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:x="urn:schemas-microsoft-com:office:excel" 
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <style>
                    td { mso-number-format:"\\@"; }
                </style>
            </head>
            <body>
                ${table}
            </body>
            </html>`;
        
        // Создаем Blob и сохраняем файл
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reviews_${new Date().toISOString().split('T')[0]}.xls`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Основная функция парсинга
    async function collectReviews() {
        while (reviews.length < maxReviews) {
            const reviewElements = document.querySelectorAll('.business-reviews-card-view__review');
            for (const element of reviewElements) {
                if (reviews.length >= maxReviews) break;
                
                try {
                    // Получаем текст отзыва
                    const textElement = element.querySelector('.business-review-view__body-text');
                    if (!textElement) continue;
                    
                    // Получаем дату
                    const dateElement = element.querySelector('.business-review-view__date');
                    if (!dateElement) continue;
                    
                    // Получаем рейтинг
                    const ratingElement = element.querySelector('.business-rating-badge-view__stars');
                    const stars = ratingElement ? ratingElement.querySelectorAll('.business-rating-badge-view__star._full').length : 'Нет оценки';
                    
                    // Проверяем, не собрали ли мы уже этот отзыв
                    const reviewText = textElement.textContent.trim();
                    const reviewDate = dateElement.textContent.trim();
                    
                    if (!reviews.some(r => r.text === reviewText && r.date === reviewDate)) {
                        reviews.push({
                            date: reviewDate,
                            time: new Date().toLocaleTimeString(),
                            rating: stars,
                            text: reviewText
                        });
                        
                        console.log(`Собран отзыв от ${reviewDate}`);
                    }
                } catch (error) {
                    console.error('Ошибка при парсинге отзыва:', error);
                }
            }
            
            if (reviews.length < maxReviews) {
                await scrollToBottom();
                
                // Проверяем, появились ли новые отзывы
                const newReviewCount = document.querySelectorAll('.business-reviews-card-view__review').length;
                if (newReviewCount === reviewElements.length) {
                    console.log('Больше отзывов не найдено');
                    break;
                }
            }
        }
        
        return reviews;
    }
    
    // Запускаем сбор отзывов
    collectReviews().then(reviews => {
        console.log(`Собрано отзывов: ${reviews.length}`);
        if (reviews.length > 0) {
            saveToXLSX(reviews);
            console.log('Файл с отзывами сохранен');
        }
    });
}

// Инструкция по использованию
console.log(`
Инструкция по использованию парсера:
1. Откройте страницу с отзывами компании на Яндекс.Картах
2. Откройте консоль разработчика (F12 или Command+Option+I на Mac)
3. Вставьте весь этот код в консоль
4. Вызовите функцию parseReviews(количество_отзывов)
   Например: parseReviews(10) для сбора 10 отзывов

Примечание: отзывы будут автоматически сохранены в Excel-файл
`);
