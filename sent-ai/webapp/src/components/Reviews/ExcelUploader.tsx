import { useState } from "react";
import * as XLSX from "xlsx";
import "./ExcelViewer.css";

interface ExcelData {
  [key: string]: any;
}

interface ExcelViewerProps {
  onUploadSuccess?: () => void;
}

export const ExcelViewer = ({ onUploadSuccess }: ExcelViewerProps) => {
  const [data, setData] = useState<ExcelData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaveError(null);
    setSaveSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Включаем пустые строки и форматируем значения как строки
        const jsonData = XLSX.utils.sheet_to_json<ExcelData>(worksheet, {
          raw: false,
          defval: "",
          blankrows: false,
        });

        console.log("Excel data after parsing:", jsonData);

        if (jsonData.length > 0) {
          setHeaders(Object.keys(jsonData[0]));
          setData(jsonData);
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        setSaveError("Ошибка при чтении файла Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveToDatabase = async () => {
    if (data.length === 0) {
      setSaveError(
        "Нет данных для сохранения. Пожалуйста, загрузите файл Excel."
      );
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const token = localStorage.getItem("token");
      if (!token) {
        setSaveError("Необходима авторизация");
        return;
      }

      console.log("Raw Excel data:", data);
      console.log("Headers:", headers);

      const reviews = data.map((row) => {
        console.log("Processing row:", row);

        // Проверяем все возможные названия полей для текста
        const possibleTextFields = [
          "text",
          "Text",
          "ТЕКСТ",
          "Текст",
          "отзыв",
          "Отзыв",
          "ОТЗЫВ",
          "comment",
          "Comment",
          "COMMENT",
          "комментарий",
          "Комментарий",
        ];

        // Ищем текст во всех возможных полях
        let text = "";
        for (const field of possibleTextFields) {
          if (
            row[field] !== undefined &&
            row[field] !== null &&
            row[field] !== ""
          ) {
            text = String(row[field]);
            break;
          }
        }

        console.log("Found text:", text);

        // Получаем значения из разных возможных названий полей для остальных данных
        const rating = parseFloat(
          String(
            row.rating ||
              row.Rating ||
              row.ОЦЕНКА ||
              row.Оценка ||
              row["rating"] ||
              row["оценка"] ||
              0
          )
        );
        let date =
          row.date ||
          row.Date ||
          row.ДАТА ||
          row.Дата ||
          row["date"] ||
          row["дата"];
        let collectionTime =
          row.collectionTime ||
          row.CollectionTime ||
          row.ВРЕМЯ_СБОРА ||
          row.Время_сбора ||
          row["collection_time"] ||
          row["время сбора"] ||
          row["время_сбора"];

        // Убеждаемся, что у нас есть все необходимые данные
        // Добавляем подробную проверку и логирование
        if (!text || text.trim() === "") {
          console.error("Empty text found in row:", row);
          console.error("Available fields in row:", Object.keys(row));
          throw new Error(
            `Отсутствует текст отзыва в строке. Доступные поля: ${Object.keys(
              row
            ).join(", ")}`
          );
        }

        if (isNaN(rating)) {
          console.error("Invalid rating in row:", row);
          throw new Error(
            "Некорректное значение рейтинга в одной или нескольких строках"
          );
        }

        // Обработка дат
        try {
          // Если дата передана как число (Excel serial number)
          if (typeof date === "number") {
            // Конвертируем Excel serial number в JavaScript Date
            date = new Date(Math.round((date - 25569) * 86400 * 1000));
          } else {
            date = new Date(date);
          }

          if (typeof collectionTime === "number") {
            collectionTime = new Date(
              Math.round((collectionTime - 25569) * 86400 * 1000)
            );
          } else {
            collectionTime = new Date(collectionTime);
          }

          // Проверяем валидность дат
          if (isNaN(date.getTime())) {
            date = new Date();
          }
          if (isNaN(collectionTime.getTime())) {
            collectionTime = new Date();
          }
        } catch (error) {
          console.error("Error parsing dates:", error);
          date = new Date();
          collectionTime = new Date();
        }

        return {
          text,
          rating,
          date: date.toISOString(),
          collectionTime: collectionTime.toISOString(),
        };
      });

      const response = await fetch("http://localhost:3000/api/reviews/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviews }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении данных");
      }

      const result = await response.json();
      console.log("Save result:", result);
      setSaveSuccess(true);

      // Вызываем callback после успешного сохранения
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveError(
        error instanceof Error ? error.message : "Ошибка при сохранении данных"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="excel-viewer">
      <div className="file-upload">
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileUpload}
          className="file-input"
        />
      </div>

      {data.length > 0 && (
        <>
          <div className="save-controls mb-4">
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className={`px-4 py-2 rounded-md text-black font-medium ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              }`}
            >
              {isSaving ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Сохранение...
                </>
              ) : (
                "Сохранить в базу данных"
              )}
            </button>

            {saveError && (
              <div className="mt-2 text-red-600 text-sm">{saveError}</div>
            )}

            {saveSuccess && (
              <div className="mt-2 text-green-600 text-sm">
                Данные успешно сохранены в базу данных!
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-header id-column">ID</th>
                  {headers.map((header, index) => (
                    <th key={index} className="table-header">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "even-row" : "odd-row"}
                  >
                    <td className="table-cell id-column">{rowIndex + 1}</td>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="table-cell">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
