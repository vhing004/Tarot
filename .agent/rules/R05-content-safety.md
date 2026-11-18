---
id: R05
name: content-safety
trigger: always_on
description: Bản quyền nội dung bài/quẻ/asset, disclaimer, giọng văn, xử lý câu hỏi nhạy cảm.
---
# R05: Nội dung & an toàn

## 1. Bản quyền
- **Tarot**: dùng bộ Rider-Waite-Smith (1909, public domain) hoặc ảnh tự vẽ/được cấp phép. Bộ hiện đại khác = chưa dùng cho đến khi xác nhận giấy phép.
- **Lời quẻ Kinh Dịch**: viết lại bằng lời của dự án (diễn giải ngắn gọn, dễ hiểu). **Cấm sao chép** bản dịch/chú giải có bản quyền.
- **Âm thanh, font, model, texture bên thứ ba**: chỉ dùng CC0/CC-BY/được cấp phép; mỗi asset ghi nguồn + giấy phép trong `SOURCES.md` cùng thư mục dữ liệu (cột: file, nguồn/URL, tác giả, giấy phép, yêu cầu ghi công).
- Không có `SOURCES.md` khớp thì asset **chưa được commit** (gate [G5](R07-quality-gates.md)).
- Asset do AI sinh: ghi rõ trong `SOURCES.md`.

## 2. Disclaimer
Màn hình kết quả luôn hiện dòng (qua `t('disclaimer')`): "Chỉ mang tính giải trí và tham khảo, không thay thế tư vấn chuyên môn." Không được ẩn dòng này bằng cài đặt.

## 3. Giọng văn lời giải
- Nhẹ nhàng, gợi mở, tập trung vào **suy ngẫm và hành động của người hỏi**; tránh khẳng định tuyệt đối về tương lai.
- **Cấm**: dự đoán cái chết/bệnh tật cụ thể, kết luận y tế/pháp lý/tài chính ("chắc chắn lãi", "sẽ ly hôn"), hù dọa, thúc ép mua/trả tiền để "hóa giải".
- Mỗi mục bài/quẻ có cả sắc thái tích cực và lưu ý, không chỉ "xấu".

## 4. Câu hỏi nhạy cảm
- Nếu câu hỏi có dấu hiệu liên quan tự làm hại bản thân/ý định tự tử, bạo lực với người khác, hoặc khủng hoảng sức khỏe nghiêm trọng: **không thực hiện lượt bói**. Hiện thông điệp quan tâm, khuyến khích nói chuyện với người tin cậy hoặc chuyên gia/đường dây hỗ trợ tại địa phương, kèm nút quay lại.
- Danh sách từ khóa (vi/en) đặt ở `shared/constants.ts`, kiểm bằng hàm thuần `isSensitiveQuestion(text)` có test. Không gửi nội dung câu hỏi tới bên thứ ba ở bước này.
- Thông điệp viết ấm áp, không phán xét, không chẩn đoán.

## 5. Dữ liệu cá nhân
- Câu hỏi của người dùng là dữ liệu cá nhân: chỉ lưu cục bộ (hoặc tài khoản của họ ở P5), **không** đưa vào analytics/log. Cho phép xóa từng lượt và xóa tất cả.
- Khi gửi câu hỏi tới AI ([R06 §6](R06-security.md)), phải báo rõ cho người dùng và cho phép tắt.

## 6. Độ tuổi
Không có nội dung người lớn, không quảng cáo cờ bạc/số đề, không gợi ý "đánh số/lô đề". Không làm tính năng dự đoán xổ số.
