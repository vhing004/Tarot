# TAROT --- Tài liệu nền tảng để phát triển game

> **Mục đích:** Tài liệu tham khảo về Tarot và đặc tả nội dung/sản phẩm
> ở mức nền tảng để phát triển một trò chơi Tarot có chiều sâu, nhất
> quán và có thể mở rộng.\
> **Định hướng đề xuất:** game khám phá biểu tượng, kể chuyện, giải đố
> nhẹ và tự phản chiếu; không mô tả Tarot như công cụ dự đoán chắc chắn
> tương lai, chẩn đoán sức khỏe hay thay thế tư vấn chuyên môn.

------------------------------------------------------------------------

## 1. Tổng quan

Tarot là một hệ thống bộ bài thường có **78 lá**, gồm:

-   **Major Arcana (Ẩn chính):** 22 lá, đánh số từ 0 đến XXI.
-   **Minor Arcana (Ẩn phụ):** 56 lá, chia thành bốn chất; mỗi chất có
    14 lá.

Tarot ban đầu phát triển ở châu Âu như một dạng bài chơi trong thế kỷ
XV. Việc sử dụng Tarot cho bói toán và huyền học phát triển mạnh hơn
nhiều thế kỷ sau. Vì vậy, khi xây dựng game, nên phân biệt lịch sử của
bộ bài với các diễn giải huyền học hình thành về sau.

### 1.1. Những hệ thống Tarot phổ biến

  -----------------------------------------------------------------------
  Hệ thống                Đặc điểm                Lưu ý khi triển khai
  ----------------------- ----------------------- -----------------------
  Tarot de Marseille      Truyền thống lâu đời;   Cần hệ thống diễn giải
                          các lá số Minor thường  và hình ảnh riêng
                          không minh họa cảnh kể  
                          chuyện đầy đủ           

  Rider--Waite--Smith     78 lá; Minor Arcana có  Phù hợp làm hệ quy
  (RWS)                   minh họa cảnh; ảnh      chiếu ban đầu
                          hưởng lớn đến Tarot     
                          hiện đại                

  Thoth Tarot             Hệ thống biểu tượng     Nên triển khai như một
                          phức hợp, có liên hệ    hệ nội dung riêng,
                          chiêm tinh và huyền học không trộn tùy tiện với
                                                  RWS
  -----------------------------------------------------------------------

**Khuyến nghị:** Chọn một hệ thống làm chuẩn dữ liệu ban đầu, ví dụ RWS,
rồi thiết kế kiến trúc cho phép bổ sung các bộ bài khác. Không nên ghép
ý nghĩa của nhiều truyền thống thành một định nghĩa duy nhất mà không
ghi rõ nguồn/hệ quy chiếu.

------------------------------------------------------------------------

## 2. Cấu trúc 78 lá

### 2.1. Major Arcana --- 22 lá Ẩn chính

Ẩn chính thường đại diện cho chủ đề lớn, nguyên mẫu, bước ngoặt hoặc bài
học trong một câu chuyện. Thứ tự phổ biến của hệ RWS:

  ------------------------------------------------------------------------
                     Số Tên tiếng Anh    Tên tiếng Việt   Từ khóa chủ đạo
                                         tham khảo        
  --------------------- ---------------- ---------------- ----------------
                      0 The Fool         Kẻ Khờ           Khởi đầu, tò mò,
                                                          tự do

                      I The Magician     Nhà Ảo Thuật     Năng lực, tập
                                                          trung, chủ động

                     II The High         Nữ Tư Tế         Trực giác, im
                        Priestess                         lặng, tri thức
                                                          ẩn

                    III The Empress      Hoàng Hậu        Nuôi dưỡng, sáng
                                                          tạo, phong phú

                     IV The Emperor      Hoàng Đế         Cấu trúc, kỷ
                                                          luật, trách
                                                          nhiệm

                      V The Hierophant   Giáo Hoàng       Truyền thống,
                                                          học hỏi, niềm
                                                          tin

                     VI The Lovers       Những Người Yêu  Kết nối, giá
                                         Nhau             trị, lựa chọn

                    VII The Chariot      Cỗ Xe            Quyết tâm, định
                                                          hướng, tự chủ

                   VIII Strength         Sức Mạnh         Kiên nhẫn, can
                                                          đảm, dịu dàng

                     IX The Hermit       Ẩn Sĩ            Nội quan, tĩnh
                                                          lặng, tìm kiếm

                      X Wheel of Fortune Bánh Xe Số Phận  Chu kỳ, biến
                                                          chuyển, cơ hội

                     XI Justice          Công Lý          Công bằng, sự
                                                          thật, hệ quả

                    XII The Hanged Man   Người Treo Ngược Tạm dừng, buông
                                                          bỏ, góc nhìn mới

                   XIII Death            Cái Chết         Kết thúc chu kỳ,
                                                          chuyển đổi

                    XIV Temperance       Tiết Chế         Điều hòa, kiên
                                                          nhẫn, cân bằng

                     XV The Devil        Ác Quỷ           Ràng buộc, cám
                                                          dỗ, lệ thuộc

                    XVI The Tower        Tòa Tháp         Đổ vỡ cấu trúc,
                                                          thức tỉnh, biến
                                                          động

                   XVII The Star         Ngôi Sao         Hy vọng, phục
                                                          hồi, cảm hứng

                  XVIII The Moon         Mặt Trăng        Mơ hồ, tưởng
                                                          tượng, bất định

                    XIX The Sun          Mặt Trời         Sáng rõ, sinh
                                                          lực, niềm vui

                     XX Judgement        Phán Xét / Thức  Đánh giá lại,
                                         Tỉnh             tiếng gọi, tái
                                                          định hướng

                    XXI The World        Thế Giới         Hoàn tất, tích
                                                          hợp, thành tựu
  ------------------------------------------------------------------------

**Lưu ý thứ tự:** Trong RWS, Strength là VIII và Justice là XI. Một số
truyền thống khác hoán đổi vị trí hai lá này. Lưu `deckSystem` hoặc
`tradition` trong dữ liệu để tránh nhầm lẫn.

### 2.2. Minor Arcana --- 56 lá Ẩn phụ

Có bốn chất, mỗi chất gồm Ace, số 2--10 và bốn Court Cards (Page,
Knight, Queen, King).

  -----------------------------------------------------------------------
  Chất              Tên khác          Nguyên tố thường  Lĩnh vực biểu
                                      gắn               tượng
  ----------------- ----------------- ----------------- -----------------
  Wands             Batons / Staves   Lửa               Động lực, sáng
                                                        tạo, hành động, ý
                                                        chí

  Cups              Chalices          Nước              Cảm xúc, quan hệ,
                                                        đồng cảm, trực
                                                        giác

  Swords            Blades            Khí               Tư duy, giao
                                                        tiếp, quyết định,
                                                        xung đột

  Pentacles         Coins / Disks     Đất               Vật chất, công
                                                        việc, kỹ năng,
                                                        nguồn lực
  -----------------------------------------------------------------------

Các liên hệ nguyên tố là quy ước phổ biến trong nhiều hệ diễn giải hiện
đại; không phải mọi truyền thống đều dùng hoàn toàn giống nhau.

### 2.3. Ý nghĩa số học dùng làm lớp diễn giải

  Hạng   Chủ đề gợi ý
  ------ ---------------------------------------
  Ace    Hạt giống, cơ hội, khởi phát
  2      Hai phía, cân bằng, lựa chọn
  3      Phát triển, phối hợp, biểu đạt
  4      Nền tảng, cấu trúc, ổn định
  5      Xáo trộn, thử thách, điều chỉnh
  6      Hài hòa, hỗ trợ, trao đổi
  7      Kiểm nghiệm, chiến lược, kiên trì
  8      Chuyển động, thực hành, tiến triển
  9      Tích lũy, trưởng thành, gần hoàn tất
  10     Kết quả chu kỳ, cực điểm, chuyển tiếp

Đây là khung tham khảo, không phải công thức cố định. Ví dụ Five of Cups
và Five of Wands đều mang sắc thái thử thách nhưng biểu hiện ở lĩnh vực
khác nhau.

### 2.4. Court Cards

  Lá       Vai trò biểu tượng tham khảo
  -------- --------------------------------------------------
  Page     Người học, tò mò, thông điệp, tiềm năng mới
  Knight   Người hành động, theo đuổi, chuyển động
  Queen    Sự trưởng thành bên trong, tiếp nhận, nuôi dưỡng
  King     Làm chủ, tổ chức, định hướng, trách nhiệm

Court Card có thể đại diện cho một người, một phong cách hành động, một
vai trò hoặc một phần tính cách. Không nên mặc định Page luôn là trẻ em,
Queen luôn là phụ nữ hay King luôn là đàn ông.

------------------------------------------------------------------------

## 3. Từ khóa xuôi và ngược

Một lá bài có thể được đọc theo chiều xuôi (**upright**) hoặc ngược
(**reversed**). Lá ngược không mặc định là xấu hoặc đối nghĩa hoàn toàn
với lá xuôi. Có thể diễn giải theo các hướng:

1.  Năng lượng bị cản trở hoặc chưa được biểu hiện.
2.  Chủ đề hướng vào nội tâm.
3.  Biểu hiện quá mức hoặc thiếu hụt.
4.  Một khía cạnh cần được xem xét lại.

Ví dụ:

  -----------------------------------------------------------------------
  Lá                      Xuôi --- từ khóa        Ngược --- hướng diễn
                                                  giải tham khảo
  ----------------------- ----------------------- -----------------------
  The Fool                Cởi mở, khởi đầu        Bốc đồng, thiếu chuẩn
                                                  bị hoặc ngại bắt đầu

  The Magician            Chủ động, vận dụng      Phân tán, thiếu tập
                          nguồn lực               trung, dùng năng lực
                                                  sai hướng

  The High Priestess      Lắng nghe, trực giác    Bỏ qua cảm nhận, thông
                                                  tin chưa rõ

  The Empress             Nuôi dưỡng, sáng tạo    Quá chiều chuộng, trì
                                                  trệ, thiếu chăm sóc bản
                                                  thân

  The Emperor             Trật tự, trách nhiệm    Cứng nhắc, kiểm soát
                                                  quá mức

  The Lovers              Kết nối, lựa chọn theo  Bất đồng, thiếu thống
                          giá trị                 nhất

  The Chariot             Quyết tâm, tiến lên     Mất phương hướng, cố
                                                  kiểm soát

  Strength                Kiên nhẫn, can đảm      Tự nghi ngờ, thiếu điều
                                                  hòa

  The Hermit              Chiêm nghiệm            Thu mình quá mức, né
                                                  tránh kết nối

  Wheel of Fortune        Chu kỳ, cơ hội          Kháng cự thay đổi, cảm
                                                  giác mất nhịp

  Justice                 Công bằng, rõ ràng      Thiên lệch, né tránh
                                                  trách nhiệm

  The Hanged Man          Tạm dừng, đổi góc nhìn  Trì hoãn, mắc kẹt

  Death                   Chuyển đổi, kết thúc    Khó buông bỏ, chống lại
                          giai đoạn               thay đổi

  Temperance              Cân bằng, điều độ       Mất cân bằng, thiếu
                                                  kiên nhẫn

  The Devil               Nhận diện ràng buộc     Bắt đầu thoát khỏi ràng
                                                  buộc hoặc chưa nhận
                                                  diện chúng

  The Tower               Sự thật làm thay đổi    Tránh né thay đổi, bất
                          cấu trúc                ổn kéo dài

  The Star                Hy vọng, phục hồi       Nản lòng, mất cảm hứng

  The Moon                Bất định, tưởng tượng   Dần sáng tỏ hoặc vẫn
                                                  còn hoang mang

  The Sun                 Rõ ràng, niềm vui       Niềm vui bị che khuất,
                                                  kỳ vọng quá cao

  Judgement               Nhận thức, đánh giá lại Tự phán xét, ngại bước
                                                  sang giai đoạn mới

  The World               Hoàn tất, tích hợp      Việc chưa khép lại,
                                                  thiếu cảm giác hoàn
                                                  thành
  -----------------------------------------------------------------------

Bảng này chỉ minh họa cách viết nội dung. Khi hoàn thiện game, cần biên
tập ý nghĩa riêng cho từng lá trong từng ngữ cảnh và ghi rõ hệ quy
chiếu.

------------------------------------------------------------------------

## 4. Các chủ đề và biểu tượng

### 4.1. Biểu tượng thường gặp

  Biểu tượng          Liên tưởng phổ biến
  ------------------- ------------------------------------------------
  Mặt Trời            Sự sống, rõ ràng, sinh lực
  Mặt Trăng           Vô thức, chu kỳ, điều chưa rõ
  Ngôi Sao            Hy vọng, định hướng, cảm hứng
  Nước                Cảm xúc, dòng chảy, trực giác
  Núi                 Thử thách, mục tiêu, khoảng cách
  Con đường           Hành trình, lựa chọn
  Cây cối             Sinh trưởng, sức sống, thời gian
  Vương miện / ngai   Quyền hạn, trách nhiệm, địa vị
  Cánh cửa            Ngưỡng chuyển tiếp, cơ hội
  Con vật             Bản năng, phẩm chất, cảnh báo trong câu chuyện

Không gán một nghĩa duy nhất cho biểu tượng. Hãy đọc biểu tượng trong
toàn bộ bố cục của lá bài.

### 4.2. Màu sắc

Màu đỏ có thể gợi năng lượng; xanh dương có thể gợi sự tĩnh lặng; vàng
có thể gợi ánh sáng; trắng có thể gợi sự tinh khiết; đen có thể gợi điều
chưa biết. Đây là liên tưởng thiết kế, không phải quy tắc phổ quát.

### 4.3. Số học, nguyên tố và chiêm tinh

Nhiều trường phái Tarot kết hợp số học, nguyên tố, cung hoàng đạo hoặc
các hệ huyền học khác. Những liên hệ này khác nhau theo truyền thống.
Trong game, mỗi liên hệ nên có metadata về `system`, `source` và
`confidence` thay vì được coi là dữ kiện lịch sử hay khoa học.

------------------------------------------------------------------------

## 5. Trải bài (Spread)

Spread là bố cục các lá bài, trong đó mỗi vị trí có một vai trò diễn
giải. Cùng một lá bài có thể mang sắc thái khác nhau tùy vị trí.

### 5.1. Một lá

Dùng cho một câu hỏi ngắn hoặc một chủ đề suy ngẫm.

Ví dụ vị trí: - Chủ đề hôm nay. - Điều cần chú ý. - Một góc nhìn khác.

### 5.2. Ba lá

Các mẫu phổ biến:

  ------------------------------------------------------------------------------------
  Mẫu                            Vị trí 1          Vị trí 2          Vị trí 3
  ------------------------------ ----------------- ----------------- -----------------
  Past--Present--Future          Quá khứ           Hiện tại          Khả năng tiếp
                                                                     diễn

  Situation--Challenge--Advice   Tình huống        Thách thức        Gợi ý hành động

  Mind--Heart--Action            Suy nghĩ          Cảm xúc           Hành động

  Problem--Cause--Perspective    Vấn đề            Yếu tố liên quan  Góc nhìn mới
  ------------------------------------------------------------------------------------

Nên dùng ngôn ngữ "xu hướng", "khả năng", "gợi ý" thay cho lời khẳng
định chắc chắn về tương lai.

### 5.3. Celtic Cross --- 10 lá

Một biến thể phổ biến có các vị trí:

1.  Tình hình hiện tại.
2.  Thách thức hoặc yếu tố cắt ngang.
3.  Nền tảng / gốc rễ.
4.  Ảnh hưởng đã qua.
5.  Mục tiêu hoặc điều đang ý thức.
6.  Khả năng sắp tới.
7.  Góc nhìn của người hỏi.
8.  Môi trường / ảnh hưởng bên ngoài.
9.  Hy vọng và lo ngại.
10. Hướng kết quả nếu tình hình tiếp diễn.

Có nhiều biến thể Celtic Cross; hãy cố định một phiên bản trong game và
ghi rõ mô tả vị trí.

------------------------------------------------------------------------

## 6. Quy trình diễn giải một trải bài

Một quy trình nhất quán giúp trải nghiệm game có chất lượng:

1.  **Xác định câu hỏi:** Chủ đề, phạm vi và mục đích.
2.  **Chọn spread:** Chọn số lá và ý nghĩa từng vị trí.
3.  **Rút bài:** Dùng bộ bài đã chọn và cơ chế ngẫu nhiên minh bạch.
4.  **Đọc từng lá:** Giải thích từ khóa, hình ảnh và ý nghĩa theo vị
    trí.
5.  **Đọc tương quan:** Xem các lá hỗ trợ, tương phản hoặc lặp lại chủ
    đề.
6.  **Tổng hợp:** Viết thông điệp ngắn, cân bằng, không tuyệt đối hóa.
7.  **Gợi ý phản tư:** Đặt một câu hỏi giúp người chơi tự suy nghĩ.
8.  **Lưu nhật ký:** Cho phép người chơi ghi lại cảm nhận và xem lại
    trải bài.

### 6.1. Nguyên tắc tổng hợp

-   Không chỉ cộng các từ khóa; hãy xem câu chuyện chung.
-   Major Arcana có thể làm nổi bật chủ đề lớn, nhưng không tự động
    "mạnh hơn" mọi lá Minor.
-   Nhiều lá cùng chất có thể làm nổi bật một lĩnh vực.
-   Lá xuôi/ngược chỉ là một lớp diễn giải, không phải đánh giá tốt/xấu.
-   Câu hỏi và vị trí quyết định sắc thái.
-   Nội dung nên có nhiều cách hiểu hợp lý, tránh áp đặt.

------------------------------------------------------------------------

## 7. Ý tưởng thiết kế game Tarot

### 7.1. Định vị sản phẩm

Đề xuất một game kết hợp: - Bộ sưu tập 78 lá và thư viện kiến thức. -
Trải bài tương tác. - Cốt truyện phân nhánh dựa trên biểu tượng. - Nhiệm
vụ khám phá ý nghĩa lá bài. - Nhật ký suy ngẫm cá nhân. - Tùy biến bộ
bài và giao diện.

Tránh biến game thành dịch vụ đặt cược, trò chơi ăn thua bằng tiền hoặc
đưa ra lời hứa dự đoán chắc chắn.

### 7.2. Các chế độ chơi

  -----------------------------------------------------------------------
  Chế độ                  Mô tả                   Giá trị gameplay
  ----------------------- ----------------------- -----------------------
  Learn Tarot             Học 78 lá theo nhóm     Kiến thức và tiến trình

  Daily Reflection        Một lá/ngày kèm câu hỏi Thói quen quay lại
                          suy ngẫm                

  Guided Reading          Trải bài theo mẫu có    Trải nghiệm cốt lõi
                          hướng dẫn               

  Story Mode              Cốt truyện theo hành    Khám phá và lựa chọn
                          trình Major Arcana      

  Symbol Quest            Tìm biểu tượng trong    Quan sát và giải đố
                          hình minh họa           

  Deck Collection         Mở khóa bộ hình ảnh     Sưu tập
                          bằng thành tích         
                          gameplay                

  Journal                 Lưu trải bài và ghi chú Cá nhân hóa
  -----------------------------------------------------------------------

### 7.3. Vòng lặp gameplay đề xuất

`Chọn chủ đề → Chọn spread → Xáo bài → Rút bài → Khám phá biểu tượng → Đọc diễn giải → Trả lời câu hỏi phản tư → Nhận tiến trình / vật phẩm trang trí`

Không dùng thông điệp gây sợ hãi hoặc tạo áp lực người chơi phải tiếp
tục rút bài để "xác nhận" kết quả.

### 7.4. Tiến trình và phần thưởng

Phần thưởng phù hợp: - Huy hiệu hoàn thành bài học. - Chủ đề giao
diện. - Khung bài và hiệu ứng lật bài. - Trang trí không gian đọc bài. -
Mở khóa nội dung cốt truyện. - Bộ sưu tập ghi chú biểu tượng.

Không gắn phần thưởng với việc người chơi phải trả tiền để nhận một kết
quả bói tốt hơn.

------------------------------------------------------------------------

## 8. UX/UI và trải nghiệm người dùng

### 8.1. Các màn hình chính

1.  **Home:** tiếp tục hành trình, bài học, trải bài nhanh.
2.  **Deck Selection:** chọn bộ bài và xem phong cách nghệ thuật.
3.  **Question Setup:** chọn chủ đề hoặc nhập câu hỏi.
4.  **Spread Selection:** xem bố cục, số lá và ý nghĩa vị trí.
5.  **Shuffle & Draw:** hoạt ảnh xáo và rút bài; có tùy chọn bỏ qua.
6.  **Reading Result:** hiển thị từng lá, vị trí và diễn giải tổng hợp.
7.  **Card Detail:** hình ảnh, từ khóa, biểu tượng, xuôi/ngược, nội dung
    học.
8.  **Journal:** lịch sử, ghi chú, bộ lọc.
9.  **Progress:** bài học đã hoàn thành, huy hiệu.
10. **Settings:** ngôn ngữ, âm thanh, quyền riêng tư, xóa dữ liệu.

### 8.2. Nguyên tắc UX

-   Luôn cho phép bỏ qua hoạt ảnh.
-   Không dùng rung, âm thanh hoặc thông báo gây giật mình.
-   Tương phản văn bản đủ tốt; hỗ trợ phóng to chữ.
-   Giải thích thuật ngữ cho người mới.
-   Không buộc người chơi nhập thông tin nhạy cảm.
-   Cho phép xóa nhật ký và dữ liệu cá nhân.
-   Có chế độ nội dung ngắn và chế độ học sâu.
-   Phân biệt rõ nội dung lịch sử, diễn giải truyền thống và sáng tác
    riêng của game.

------------------------------------------------------------------------

## 9. Kiến trúc dữ liệu nội dung

Nên tách dữ liệu Tarot khỏi logic game để dễ cập nhật, dịch thuật và
thêm deck mới.

### 9.1. Thực thể cốt lõi

  Entity             Vai trò
  ------------------ ------------------------------------------
  `Deck`             Bộ bài / truyền thống / phong cách
  `Card`             Định danh lá bài độc lập với deck
  `CardArtwork`      Hình ảnh của lá trong một deck cụ thể
  `CardMeaning`      Ý nghĩa theo ngôn ngữ, chiều và ngữ cảnh
  `Spread`           Định nghĩa bố cục
  `SpreadPosition`   Vai trò từng vị trí
  `Reading`          Một phiên trải bài
  `ReadingCard`      Lá được rút và vị trí
  `JournalEntry`     Ghi chú người chơi
  `Lesson`           Bài học và câu hỏi luyện tập
  `Achievement`      Thành tích trong game
  `Localization`     Bản dịch nội dung

### 9.2. Ví dụ JSON cho Card

``` json
{
  "id": "major_00_fool",
  "arcana": "major",
  "number": 0,
  "name": {
    "en": "The Fool",
    "vi": "Kẻ Khờ"
  },
  "rank": null,
  "suit": null,
  "keywords": {
    "upright": ["khởi đầu", "tò mò", "tự do"],
    "reversed": ["bốc đồng", "thiếu chuẩn bị", "do dự"]
  },
  "themes": ["new_beginnings", "exploration", "freedom"],
  "elements": [],
  "description": {
    "vi": "Biểu tượng của một khởi đầu mới và tinh thần khám phá."
  },
  "interpretations": {
    "general": {
      "upright": "Một cơ hội để bắt đầu, học hỏi và khám phá điều chưa biết.",
      "reversed": "Cân nhắc mức độ chuẩn bị và những rủi ro có thể bị bỏ qua."
    }
  },
  "artwork": {
    "deckId": "rws-inspired-original",
    "assetKey": "cards/fool.webp",
    "artist": "Tên nghệ sĩ"
  },
  "metadata": {
    "tradition": "RWS-inspired",
    "contentVersion": 1
  }
}
```

### 9.3. Ví dụ JSON cho Spread

``` json
{
  "id": "three_card_situation_challenge_advice",
  "name": {
    "en": "Situation, Challenge, Advice",
    "vi": "Tình huống – Thách thức – Gợi ý"
  },
  "cardCount": 3,
  "positions": [
    {
      "index": 0,
      "key": "situation",
      "label": "Tình huống",
      "description": "Chủ đề hoặc hoàn cảnh đang được xem xét."
    },
    {
      "index": 1,
      "key": "challenge",
      "label": "Thách thức",
      "description": "Yếu tố gây khó khăn hoặc cần chú ý."
    },
    {
      "index": 2,
      "key": "advice",
      "label": "Gợi ý",
      "description": "Một góc nhìn hoặc hành động có thể cân nhắc."
    }
  ]
}
```

### 9.4. Ví dụ JSON cho Reading

``` json
{
  "id": "reading_01",
  "userId": "user_123",
  "deckId": "rws-inspired-original",
  "spreadId": "three_card_situation_challenge_advice",
  "question": "Mình có thể cải thiện cách học như thế nào?",
  "createdAt": "2026-01-15T10:30:00Z",
  "cards": [
    {
      "positionIndex": 0,
      "cardId": "major_01_magician",
      "orientation": "upright"
    },
    {
      "positionIndex": 1,
      "cardId": "minor_wands_07",
      "orientation": "reversed"
    },
    {
      "positionIndex": 2,
      "cardId": "minor_pentacles_08",
      "orientation": "upright"
    }
  ],
  "summary": "Tập trung vào nguồn lực hiện có, giảm phân tán và duy trì luyện tập đều đặn."
}
```

Dữ liệu ví dụ chỉ minh họa cấu trúc. Trong ứng dụng thật, không nên lưu
dữ liệu định danh giả như `user_123` nếu chưa có hệ thống người dùng phù
hợp.

### 9.5. Quy tắc định danh

Đề xuất ID ổn định: - Major: `major_00_fool` đến `major_21_world`. -
Minor: `minor_wands_ace`, `minor_cups_02`, `minor_swords_king`,
`minor_pentacles_page`.

Không dùng tên dịch làm primary key vì bản dịch có thể thay đổi.

------------------------------------------------------------------------

## 10. Logic xáo bài và rút bài

### 10.1. Yêu cầu chức năng

-   Mỗi lần trải bài sử dụng một bản sao bộ 78 lá.
-   Không rút trùng lá trong cùng một lần trải, trừ khi game chủ ý hỗ
    trợ biến thể có hoàn lại.
-   Hướng lá (`upright` / `reversed`) được xác định độc lập theo cấu
    hình.
-   Lưu thứ tự lá đã rút để có thể mở lại lịch sử.
-   Cho phép người chơi chọn rút ngẫu nhiên hoặc chế độ học có kiểm
    soát.

### 10.2. Thuật toán

Dùng Fisher--Yates shuffle để xáo một mảng:

``` text
function shuffle(cards):
    result = copy(cards)

    for i from length(result) - 1 down to 1:
        j = randomInteger(0, i)
        swap(result[i], result[j])

    return result
```

Sau khi xáo, lấy `N` lá đầu tiên tương ứng với số vị trí trong spread.
Nếu có chiều ngược, xác định orientation theo xác suất cấu hình, ví dụ
`reversedProbability = 0.5`.

Đối với game offline thông thường, bộ sinh số ngẫu nhiên của nền tảng có
thể đủ cho trải nghiệm. Nếu cần tính công bằng có thể kiểm toán trong
môi trường nhiều người chơi, cần thiết kế cơ chế server-side và ghi log
phù hợp. Không trình bày kết quả ngẫu nhiên như bằng chứng siêu nhiên.

------------------------------------------------------------------------

## 11. Hệ thống nội dung diễn giải

Không nên lưu duy nhất một đoạn văn cho mỗi lá. Một hệ thống tốt nên
chia nội dung thành các lớp:

1.  `keywords`: từ khóa ngắn.
2.  `overview`: mô tả tổng quan.
3.  `symbolism`: giải thích hình ảnh.
4.  `uprightMeaning`: diễn giải xuôi.
5.  `reversedMeaning`: diễn giải ngược.
6.  `contextualMeaning`: diễn giải theo chủ đề.
7.  `positionMeaning`: diễn giải theo vị trí trong spread.
8.  `reflectionPrompt`: câu hỏi phản tư.
9.  `relatedCards`: liên hệ với lá khác.
10. `sourceNotes`: hệ quy chiếu và nguồn biên tập.

### 11.1. Các ngữ cảnh

  Context key         Nội dung
  ------------------- -------------------------------
  `general`           Tổng quan
  `relationships`     Quan hệ và giao tiếp
  `learning`          Học tập và phát triển kỹ năng
  `work`              Công việc và mục tiêu
  `creativity`        Sáng tạo
  `personal_growth`   Phát triển bản thân

Không nên đưa ra kết luận chắc chắn về người khác đang nghĩ gì, có phản
bội hay không, hoặc sự kiện nào chắc chắn sẽ xảy ra.

### 11.2. Template tổng hợp

``` text
[Chủ đề chính]
Trải bài gợi mở chủ đề ...

[Từng lá]
- [Tên lá] tại vị trí [Tên vị trí]: ...
- [Tên lá] tại vị trí [Tên vị trí]: ...
- [Tên lá] tại vị trí [Tên vị trí]: ...

[Liên kết]
Các lá có điểm chung / tương phản ở ...

[Gợi ý]
Bạn có thể cân nhắc ...

[Câu hỏi phản tư]
Điều gì trong tình huống này nằm trong khả năng chủ động của bạn?
```

------------------------------------------------------------------------

## 12. Yêu cầu phi chức năng

  -----------------------------------------------------------------------
  Nhóm                                Yêu cầu
  ----------------------------------- -----------------------------------
  Hiệu năng                           Màn hình thư viện và chi tiết lá
                                      bài tải nhanh; ảnh có thumbnail

  Mở rộng                             Thêm deck, ngôn ngữ, spread mà
                                      không sửa lõi

  Bảo trì                             Nội dung tách khỏi code; có version

  Offline                             Thư viện và trải bài cơ bản có thể
                                      dùng offline

  Bảo mật                             Nhật ký riêng tư; xác thực và phân
                                      quyền nếu đồng bộ

  Khả năng tiếp cận                   Hỗ trợ screen reader, tương phản,
                                      cỡ chữ

  Quốc tế hóa                         Nội dung có locale; không hard-code
                                      chuỗi

  Quan sát hệ thống                   Ghi nhận lỗi kỹ thuật, không thu
                                      thập câu hỏi riêng tư nếu không cần
  -----------------------------------------------------------------------

### 12.1. Quyền riêng tư

-   Câu hỏi và nhật ký trải bài có thể chứa thông tin cá nhân; mặc định
    nên để riêng tư.
-   Chỉ đồng bộ khi người chơi chủ động bật.
-   Có chức năng xuất và xóa dữ liệu.
-   Không dùng nội dung nhật ký cho quảng cáo cá nhân hóa.
-   Không yêu cầu ngày sinh, vị trí chính xác hoặc thông tin nhạy cảm
    nếu không thực sự cần.

------------------------------------------------------------------------

## 13. Bản quyền, hình ảnh và thương hiệu

Đây là hạng mục quan trọng nếu phát hành game thương mại.

-   Không mặc định mọi hình ảnh Tarot trên Internet đều được phép sử
    dụng.
-   Tác phẩm nghệ thuật, bản scan, bản phục chế, ảnh chụp hiện vật, font
    chữ và thiết kế giao diện có thể có quyền riêng biệt.
-   Tên gọi thương mại và nhãn hiệu của một số bộ bài có thể được bảo
    hộ.
-   Việc một tác phẩm cũ thuộc phạm vi công cộng ở một quốc gia không
    đồng nghĩa mọi bản scan hoặc mọi quốc gia đều có tình trạng pháp lý
    giống nhau.
-   Nên tạo artwork gốc hoặc mua giấy phép rõ ràng; lưu hợp đồng, phạm
    vi sử dụng, lãnh thổ và thời hạn.
-   Có thể tham khảo văn bản lịch sử đã thuộc phạm vi công cộng tại một
    số khu vực, nhưng cần kiểm tra luật tại thị trường phát hành và tình
    trạng của từng tài sản.

**Khuyến nghị sản xuất:** Tạo một bộ hình ảnh nguyên bản dựa trên nghiên
cứu biểu tượng, không sao chép bố cục, nét vẽ hoặc hình ảnh cụ thể của
một deck thương mại. Ghi tên nghệ sĩ, giấy phép và nguồn trong metadata.

------------------------------------------------------------------------

## 14. Ranh giới nội dung và trách nhiệm

-   Hiển thị thông báo rằng Tarot là trải nghiệm biểu tượng/giải trí/tự
    phản chiếu, không phải dự đoán khoa học.
-   Không dùng thông điệp đe dọa, gây hoảng sợ hoặc khẳng định tai họa.
-   Không đưa ra chẩn đoán sức khỏe, khuyến nghị điều trị, tư vấn pháp
    lý hoặc quyết định tài chính như thể lá bài có thẩm quyền chuyên
    môn.
-   Với nội dung liên quan sức khỏe, an toàn hoặc khủng hoảng cá nhân,
    hướng người chơi đến người lớn đáng tin cậy hoặc chuyên gia phù hợp;
    không dùng Tarot để thay thế trợ giúp.
-   Không tạo cơ chế ép người chơi rút bài lặp lại để giảm lo âu hoặc
    xác nhận một kết quả.
-   Cho phép tắt thông báo và giới hạn thời gian chơi.

------------------------------------------------------------------------

## 15. Roadmap phát triển đề xuất

### Phase 1 --- Tarot Core

-   Tạo schema 78 lá.
-   Tạo trang danh sách và chi tiết lá bài.
-   Tìm kiếm theo tên, chất, số và từ khóa.
-   Hỗ trợ tiếng Việt và tiếng Anh.
-   Kiểm tra dữ liệu trùng/lỗi.

### Phase 2 --- Reading Engine

-   Tạo spread một lá, ba lá và Celtic Cross.
-   Xáo bài, rút bài, xuôi/ngược.
-   Lưu và mở lại reading.
-   Tạo phần tổng hợp theo template.

### Phase 3 --- Learning & Journal

-   Bài học theo Major/Minor Arcana.
-   Quiz nhận diện biểu tượng.
-   Nhật ký và bộ lọc lịch sử.
-   Thành tích học tập.

### Phase 4 --- Game Layer

-   Story Mode theo hành trình Major Arcana.
-   Nhiệm vụ khám phá biểu tượng.
-   Bộ sưu tập deck và giao diện.
-   Âm thanh, hoạt ảnh, accessibility.

### Phase 5 --- Production

-   Kiểm thử nội dung và localization.
-   Kiểm tra giấy phép artwork.
-   Kiểm thử bảo mật và quyền riêng tư.
-   Analytics tối thiểu, minh bạch.
-   Beta test, crash reporting và tối ưu hiệu năng.

------------------------------------------------------------------------

## 16. Checklist nghiệm thu MVP

-   [ ] Có đủ 78 lá và ID duy nhất.
-   [ ] Mỗi lá có tên, nhóm, chất/số phù hợp và từ khóa.
-   [ ] Có nội dung tiếng Việt nhất quán.
-   [ ] Có ít nhất 3 spread hoạt động.
-   [ ] Không có lá trùng trong một reading tiêu chuẩn.
-   [ ] Có lưu lịch sử và mở lại reading.
-   [ ] Có giải thích từng vị trí của spread.
-   [ ] Có thông báo giới hạn của Tarot.
-   [ ] Người dùng có thể xóa nhật ký.
-   [ ] Artwork có nguồn và quyền sử dụng rõ ràng.
-   [ ] Nội dung không khẳng định tương lai chắc chắn.
-   [ ] Có test cho shuffle, draw, orientation và dữ liệu card.

------------------------------------------------------------------------

## 17. Tài liệu tham khảo

1.  **Victoria and Albert Museum --- A History of Tarot Cards**\
    https://www.vam.ac.uk/articles/tarot-cards\
    Nguồn tham khảo về lịch sử, cấu trúc 78 lá, các bộ bài và quá trình
    Tarot chuyển từ trò chơi bài sang thực hành bói bài.

2.  **Arthur Edward Waite --- The Pictorial Key to the Tarot (1911)**\
    https://rider-waite.com/symbolism/pictorial-key-1-1/\
    Tài liệu lịch sử về cách diễn giải hệ Rider--Waite--Smith. Cần kiểm
    tra tình trạng bản quyền theo quốc gia và từng phiên bản tài sản
    trước khi sử dụng trong sản phẩm.

3.  **University of California eScholarship --- Divining Literature: A
    History of Tarot**\
    https://escholarship.org/uc/item/7dk7v3tm\
    Tài liệu nghiên cứu học thuật về lịch sử và cách đọc Tarot.

4.  **TarotReader.me**\
    https://tarotreader.me/\
    Website tham khảo cho trải nghiệm Tarot trực tuyến; nên tự kiểm thử
    giao diện và chức năng hiện hành trước khi dùng làm benchmark sản
    phẩm.

------------------------------------------------------------------------

## 18. Nguyên tắc biên tập nội dung cho dự án

Khi bổ sung dữ liệu cho từng lá, dùng mẫu thống nhất:

``` yaml
id: minor_cups_02
name_en: Two of Cups
name_vi: Hai Cốc
arcana: minor
suit: cups
rank: 2
keywords:
  upright: []
  reversed: []
symbolism: []
meanings:
  general:
    upright: ""
    reversed: ""
  relationships:
    upright: ""
    reversed: ""
  learning:
    upright: ""
    reversed: ""
  work:
    upright: ""
    reversed: ""
reflection_prompts: []
related_cards: []
tradition: RWS
content_version: 1
sources: []
```

Mỗi nội dung cần được: - Viết bằng lời riêng, không sao chép nguyên văn
sách hoặc website. - Gắn hệ quy chiếu (RWS, Marseille, Thoth hoặc hệ
sáng tác). - Dịch thuật nhất quán. - Rà soát để tránh mâu thuẫn giữa từ
khóa và đoạn diễn giải. - Kiểm tra bằng ví dụ trải bài thực tế trong
game.

------------------------------------------------------------------------

**Kết luận:** Hãy xem Tarot vừa là một hệ thống nội dung có cấu trúc,
vừa là một trải nghiệm tương tác. Nền tảng chuyên nghiệp nên có dữ liệu
78 lá chuẩn hóa, hệ thống spread độc lập, bộ máy diễn giải theo ngữ
cảnh, quản lý artwork/bản quyền và trải nghiệm người dùng có trách
nhiệm. Tài liệu này là bản đặc tả nền tảng; trước khi phát hành, cần
hoàn thiện nội dung chi tiết cho cả 78 lá và kiểm thử trên bộ bài/truyền
thống đã chọn.
