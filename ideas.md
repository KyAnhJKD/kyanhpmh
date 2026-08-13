# Melody Hub — Design Direction

## Three initial approaches

### Theme Name: Midnight Editorial
**Very Brief Intro:** Một không gian nghe nhạc tối, giàu chất tạp chí và có chiều sâu vật liệu; biến việc tìm bài hát thành một buổi tuyển chọn của biên tập viên âm nhạc. Tông than chì, cam san hô và xanh cobalt tạo cảm giác thân mật nhưng có cá tính.

**Probability:** 0.06

### Theme Name: Daylight Cassette
**Very Brief Intro:** Giao diện sáng như một bàn làm việc buổi sáng với bìa cassette, giấy ngà và các mảng màu hoài niệm. Trải nghiệm thân thiện, nhẹ nhàng, hướng đến người dùng muốn khám phá nhạc như đang lật một kệ đĩa.

**Probability:** 0.03

### Theme Name: Swiss Sound Lab
**Very Brief Intro:** Hệ thống tối giản theo tinh thần Swiss International Typographic Style, dùng lưới kỷ luật, chữ lớn và màu điểm nhấn có chủ ý. Tập trung vào tốc độ quét nội dung, phân loại thể loại và cảm giác sản phẩm công cụ.

**Probability:** 0.08

## Chosen approach: Midnight Editorial

### Design Movement
Contemporary music editorial kết hợp modernist collage và chất liệu analog của bìa đĩa than. Thiết kế ưu tiên cảm giác tuyển chọn có chủ đích thay vì một thư viện nội dung vô danh.

### Core Principles
1. **Tuyển chọn trước, phô diễn sau:** Mỗi khu vực phải giúp người dùng chọn bài nhanh hơn, không dùng trang trí làm nhiễu thao tác.
2. **Tương phản có nhịp:** Nền than chì làm sân khấu; cam san hô dành cho hành động chính; xanh cobalt dùng như một tín hiệu điều hướng, không phải hiệu ứng phát sáng.
3. **Bố cục có trục lệch:** Dùng sidebar, hero lệch tâm, hàng ngang cuộn được và các nhịp chia section không đều để tạo cảm giác như một tạp chí đang sống.
4. **Chạm là nghe:** Hover, focus và tap đều phải phản hồi rõ ràng; các hành động phát nhạc luôn ở gần ngón cái khi dùng điện thoại.

### Color Philosophy
Than chì (#171615) tạo nền tĩnh, giúp bìa nhạc và chữ có khoảng thở. Kem ấm (#F4EFE6) giữ cho nội dung không lạnh và tăng khả năng đọc. Cam san hô (#FF6B4A) là “đèn báo đang phát”, chỉ xuất hiện tại playhead, nút nghe và các điểm cần hành động. Xanh cobalt (#6D8DFF) dành cho các tín hiệu khám phá và nhấn nhá thị giác.

### Layout Paradigm
Trang chủ sử dụng shell ba lớp: sidebar cố định trên desktop, vùng nội dung editorial ở giữa, và mini player neo phía dưới. Trên mobile, sidebar chuyển thành bottom navigation, player trở thành thanh điều khiển nổi có thể mở rộng, còn các hàng album chuyển sang cuộn ngang để giữ nhịp quét nhanh.

### Signature Elements
- Dấu âm thanh gồm hai thanh wave lệch nhau và một chấm quỹ đạo, dùng ở logo, favicon và trạng thái phát.
- Thẻ nội dung có “gáy” màu cam mảnh bên trái để đánh dấu lựa chọn hoặc bài đang phát.
- Nhãn metadata viết hoa nhỏ, tracking rộng, giống chú thích trong tạp chí âm nhạc.

### Interaction Philosophy
Không ẩn chức năng quan trọng sau menu sâu. Một chạm vào bìa phát bài; nút ba chấm mở các hành động bổ sung; nút play đủ lớn cho thao tác ngón cái. Trạng thái phát được giữ nhất quán giữa hero, danh sách và player. Các mục chưa có backend thật sẽ báo bằng toast thân thiện thay vì dead-end.

### Animation
Entrance của các section dùng fade + translateY nhẹ, stagger 40–60ms, chỉ khi người dùng không bật reduced motion. Hover bìa nhạc dùng scale tối đa 1.02 và overlay play xuất hiện nhanh dưới 220ms. Player mở rộng bằng opacity và transform, không animate layout. Nút play có phản hồi scale 0.97 khi nhấn; waveform chuyển động chậm, chỉ khi bài đang phát.

### Typography System
Display dùng **Space Grotesk** 600–700 cho tiêu đề lớn và con số; body dùng **DM Sans** 400–600 để giữ độ rõ trên màn hình nhỏ. Metadata dùng DM Sans 700, chữ hoa, tracking 0.14em. H1 desktop 64/0.96, mobile 42/1.02; heading section 26/1.1; body 15/1.55; label 10/1.2.

### Brand Essence
Melody Hub là phòng nghe tuyển chọn dành cho người muốn tìm đúng bài hát tiếp theo giữa một thế giới âm nhạc quá rộng; khác biệt ở cảm giác biên tập có gu, thao tác gọn và luôn sẵn sàng trên điện thoại. **Tính cách:** tuyển chọn, ấm áp, tò mò.

### Brand Voice
Headline ngắn, có hình ảnh và hơi hướng biên tập; CTA dùng động từ rõ ràng, không hô hào; microcopy thân thiện như một người bạn biết nhiều nhạc nhưng không lên lớp.

> “Một bài nữa cho đoạn đường về.”

> “Bật lên. Để nhịp điệu chọn phần còn lại.”

### Wordmark & Logo
Wordmark “Melody Hub” dùng Space Grotesk SemiBold với chữ M được custom thành hai nhịp sóng đứng, kerning hơi nén. Biểu tượng độc lập là hai thanh wave lệch nhau và một chấm quỹ đạo; không dùng nốt nhạc hoặc tam giác play để tránh sáo mòn.

### Signature Brand Color
**Coral Signal — #FF6B4A.** Đây là màu của trạng thái “đang sống”: playhead, tiến độ và lời mời nghe. Nó đủ ấm để nổi trên than chì nhưng không biến hệ thống thành neon.

## Style Decisions

- Dùng dark mode làm mặc định; không thêm theme switcher ở phiên bản đầu để giữ cá tính thị giác nhất quán.
- Hero ưu tiên artwork do thương hiệu tạo, chữ đặt ở vùng tối có lớp overlay bảo đảm tương phản.
- Không dùng purple gradient, card bo tròn đồng loạt, hoặc layout căn giữa toàn trang.
- Tất cả luồng chính phải dùng được bằng một tay trên mobile: tìm kiếm, play, next, like và mở player.
