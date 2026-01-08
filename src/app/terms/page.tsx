import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "Kullanım Koşulları | Tariften",
  description: "Tariften.com kullanım koşulları ve kullanıcı sözleşmesi.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition"
      >
        <FaArrowLeft /> Anasayfaya Dön
      </Link>

      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">
        Kullanıcı Sözleşmesi
      </h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>

      <div className="prose prose-slate max-w-none">
        {/* Üst Bilgi Kutusu (Privacy tarzı) */}
        <section className="mb-10">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              Sözleşme Hakkında
            </h2>
            <p className="text-blue-800 text-sm mb-0">
              Bu Kullanıcı Sözleşmesi (“Sözleşme”), HİP Medya’nın (“Şirket”)
              www.tariften.com internet adresinde yer alan site (“Platform”) ile
              kullanıcılarına (“Kullanıcı”) sağladığı çevrimiçi veya çevrimdışı
              hizmetlerin çerçevesini oluşturur. “Platform” ve “Kullanıcı”
              arasında kurulmuş işbu “Sözleşme”, elektronik ortamda “Platform”un
              ziyaret edilmesiyle yürürlüğe girer. (Şirket ve Kullanıcı birlikte
              “Taraflar” olarak anılacaktır.)
            </p>
          </div>
        </section>

        {/* 1 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              1. Sözleşme’nin Konusu ve Kapsamı
            </h2>
            <p>
              Sözleşme’nin konusu, Platform’dan erişilen ve Platform’da paylaşılan
              fotoğraf, resim, görsel, yazı, yorum, video ve diğer tüm içeriklere
              (tümü birlikte “İçerik” olarak anılacaktır) ilişkin usul ve esasların
              çerçevesinin çizilmesi, Kullanıcı’nın Platform’dan ve Platform’da
              sunulan hizmetlerden faydalanmasına ilişkin hüküm ve koşulların
              belirlenmesi ve bu doğrultuda Taraflar’ın hak ve yükümlülüklerinin
              düzenlenmesidir.
            </p>
            <p className="mb-0">
              Platform’da, Platform’un kullanımına veya koşullarına ilişkin olarak
              sunulan her türlü kural, duyuru ve beyan işbu Sözleşme’nin ayrılmaz
              parçası olarak kabul edilecek olup, Sözleşme ile Kullanıcı, Platform’da
              yer alan veya yer alacak olan her türlü kural, duyuru, uyarı ve beyanı
              peşinen kabul etmektedir.
            </p>
          </div>
        </section>

        {/* 2 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              2. Taraflar’ın Hak ve Yükümlülükleri
            </h2>

            <ul className="space-y-3 list-disc pl-5 marker:text-slate-300">
              <li>
                <strong>2.1.</strong> Kullanıcı, Platform’dan faydalanmak için Şirket
                tarafından talep edilen bilgileri tam, doğru ve güncel bir şekilde
                sağlayarak işbu Sözleşme’yi onaylaması gerektiğini bildiğini ve
                Şirket’in dilerse Kullanıcı’dan ek bilgi ve belge talep edebileceğini
                kabul ve beyan eder. Kullanıcı’nın, Platform’a sosyal medya hesabı
                üzerinden girmesi halinde Şirket’e işbu Sözleşme’nin konusu
                çerçevesinde ilgili hesabına erişim için gerekli yetki ve izinleri
                verdiğini kabul eder.
              </li>

              <li>
                <strong>2.2.</strong> Kullanıcı statüsünün tesisi veya Platform’da
                sunulan hizmetlerden faydalanmak için sair zamanlarda sağlanan
                bilgilerde herhangi bir değişiklik olması halinde, Kullanıcı söz
                konusu bilgileri derhal güncelleyecektir. Bu bilgilerin eksik veya
                gerçeğe aykırı olarak verilmesi ya da güncel olmaması nedeniyle
                Platform’dan faydalanılamamasından Şirket sorumlu değildir.
              </li>

              <li>
                <strong>2.3.</strong> Kullanıcı, işbu Sözleşme’yi akdetmek için gereken
                yasal ehliyete sahip bulunduğunu beyan eder. Kullanıcı, oluşturulmuş
                hesaplarını, kullanıcı adı ve şifresi ile üyelik profillerini hiçbir
                şart ve koşulda başka bir kullanıcıya devredemez veya üçüncü kişilerce
                kullanımına izin veremez.
              </li>

              <li>
                <strong>2.4.</strong> Kullanıcı, Platform’un kullanımına imkan veren
                hesaplar, kullanıcı adı, e-posta adresi ve şifre de dahil olmak üzere
                tüm bilgilerin kullanım ve yönetiminden bizzat sorumludur. Kullanıcı’ya
                ait hesap, kullanıcı adı, e-posta adresi ve şifre ile gerçekleştirilen
                her işlem bizzat Kullanıcı tarafından gerçekleştirilmiş addedilecek ve
                bu bilgilerinin Kullanıcı dışında bir kişi tarafından kullanılması,
                kaybolması veya el değiştirmesi nedeniyle Kullanıcı ve/veya üçüncü
                kişilerin uğradığı zararlardan münhasıran Kullanıcı sorumlu olacaktır.
                Kullanıcı, şifresinin yetkisiz kullanımı veya güvenliğin başka bir
                şekilde ihlalinden haberdar olduğunda bu durumu derhal Şirket’e
                bildirecektir.
              </li>

              <li>
                <strong>2.5.</strong> Kullanıcı Platform’da gerçekleştireceği tüm
                işlemlerde işbu Sözleşme ile Platform’da zaman zaman yayınlanabilecek
                koşullar ile kanuna, ahlaka ve adaba, dürüstlük ilkelerine uyacak,
                herhangi bir yöntem ile Platform’un işleyişini engelleyebilecek
                davranışlarda, üçüncü kişilerin haklarına tecavüz eden veya etme
                tehlikesi bulunan fiillerde bulunmayacaktır.
              </li>

              <li>
                <strong>2.6.</strong> Platform’da bulunan yazılım, fotoğraf, resim,
                görsel ve tasarımların, yazıların, yorumların, videoların, logoların,
                grafiklerin her türlü hakkı Şirket’e aittir. Platform’un tasarımında,
                içeriğinde ve veritabanı oluşturulmasında kullanılan bilgi ve/veya
                yazılımın kopyalanması ve/veya Platform’dan faydalanmanın ötesinde
                kullanılması, Platform dahilinde bulunan her türlü fotoğraf, resim,
                görsel, metin, imge, video, dosya vb. veriler ile İçerikler’in
                kopyalanması, dağıtılması, işlenmesi ve sair şekillerde kullanılması
                kesinlikle yasaktır. Ayrıca Kullanıcılar’ın (i) Platform’un güvenliğini
                tehdit edebilecek, Platform’a ait yazılımların çalışmasını veya diğer
                Kullanıcılar’ın Platform’dan faydalanmasını engelleyebilecek herhangi
                bir girişimde bulunması, (ii) Platform’a bu sonuçları verecek şekilde
                orantısız yük bindirmesi, Platform’da yayımlanmış ve/veya başkaları
                tarafından girilmiş bilgilere ve İçerikler’e yetkisiz bir şekilde
                erişmesi, bu bilgi ve İçerikler’i kopyalaması, silmesi, değiştirmesi ya
                da bu yönde denemeler yapması; (iii) Platform’un genel güvenliğini
                tehdit edecek ve/veya Platform, Şirket ve diğer Kullanıcılar’a zarar
                verebilecek eylemlerde bulunması; (iv) Platform’un ve kullanılan
                yazılımların çalışmasını engelleyecek yazılımları kullanması, kullanmaya
                çalışması veya her türlü yazılım, donanım ve sunucuların çalışmasını
                aksatması, bozulmasına yol açması, tersine mühendislik yapması, saldırılar
                düzenlemesi, meşgul etmesi veya sair surette müdahale etmesi, Şirket
                sunucularına erişim sağlamaya çalışması kesinlikle yasaktır.
              </li>

              <li>
                <strong>2.7.</strong> Kullanıcı, Platform’da yapılacak iyileştirme ve diğer
                değişikliklerin uygulanması için Platform’a erişimin geçici olarak
                kapatılabileceğini kabul eder.
              </li>

              <li>
                <strong>2.8.</strong> Şirket’in herhangi bir sebep göstermeksizin ve herhangi
                bir ihbarda bulunmaksızın Sözleşme ve Platform üzerinden yayınladığı sair
                koşulları dilediği zamanda tek taraflı olarak değiştirme, bunlara ilavede
                bulunma veya yenileme ve Platform’u yeniden organize etme, konu, kapsam ve
                içeriğini değiştirme, yayınını durdurma hakkı saklıdır. Şirket tarafından
                Sözleşme ve sair koşullar üzerinde yapılan değişiklikler Platform’da
                yayınlandığı tarihte yürürlüğe girecek olup, Platform’un kullanılması ile
                Kullanıcı güncel koşulları kabul etmiş addedilir. Söz konusu dokümanların
                düzenli bir şekilde takip edilmesinden Kullanıcı bizzat sorumlu olacaktır.
              </li>

              <li>
                <strong>2.9.</strong> Platform’un kullanımından ve Platform üzerinden ilgili
                işlemlerin gerçekleştirilmesinden kaynaklanan her türlü yasal, idari ve cezai
                sorumluluk Kullanıcı’ya aittir. Şirket, Kullanıcı’nın Platform üzerinde
                ve/veya işlemler sırasında gerçekleştirdiği faaliyetler ve/veya işbu Sözleşme
                ve yasaya aykırı eylemleri neticesinde üçüncü kişilerin uğradıkları veya
                uğrayabilecekleri zararlardan doğrudan ve/veya dolaylı olarak hiçbir şekilde
                sorumlu tutulamaz. Üçüncü kişilerden bu kapsamda gelecek her türlü talep ile
                Kullanıcı’nın Sözleşme’de veya ilgili mevzuatta belirtilen yükümlülüklerini
                yerine getirmemesi nedeniyle Şirket’in uğrayacağı zararlar ilk talepte ferileri
                ile birlikte ödenmek üzere Kullanıcı’ya rücu edilecektir.
              </li>

              <li>
                <strong>2.10.</strong> Platform’a üye olan her Kullanıcı’ya haftalık ve aylık
                e-posta bültenler gönderebilir. Kullanıcı, dilediğinde e-posta tercihlerini
                değiştirebilir.
              </li>
            </ul>
          </div>
        </section>

        {/* 3 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              3. İçerik Paylaşımı Faaliyetlerine İlişkin Koşullar
            </h2>

            <ul className="space-y-3 list-disc pl-5 marker:text-slate-300">
              <li>
                <strong>3.1.</strong> Platform’da gerçekleştirilebilecek İçerik paylaşımı
                faaliyetlerinin münhasıran Kullanıcılar tarafından yapıldığı kabul edilir ve
                Şirket, yalnızca İçerik paylaşımı işlemlerinin gerçekleştirilebilmesi için
                Kullanıcılar’a bir platform sunmaktadır. Kullanıcılar, Platform’da paylaşılan
                İçerikler’in doğruluğu, niteliği, orijinalliği, yazılı ve/veya görüntülü
                açıklamaların doğruluğu ve tamlığı da dahil olmak üzere hiçbir konu hakkında
                Şirket’in bilgi sahibi olmadığını ve olması gerekmediğini ve bunları taahhüt
                ve garanti etmek yükümlülüğü bulunmadığını, Şirket’in herhangi bir şekilde
                İçerik paylaşımı işleminin tarafı olmadığını kabul ederler. Kullanıcı, bu
                kapsamda gerçekleştirdiği her türlü iş ve işlemin sorumluluğunun kendisine
                ait olduğunu, burada gerçekleştirilen iş ve işlemleri kendisinin
                gerçekleştirmediği yolunda herhangi bir def’i ve/veya itiraz ileri
                süremeyeceğini ve/veya bu def’i veya itiraza dayanarak yükümlülüklerini
                yerine getirmekten kaçınmayacağını, İçerik’e ilişkin tüm taleplerin
                kendisine rücu edileceğini kabul, beyan ve taahhüt eder. Şirket, Kullanıcı
                talep ve sorunlarının iletilmesi için Platform üzerinden gerekli gördüğü
                kanalları sağlayacak olup Şirket tarafından sunulan bilgilendirme ve iletişim
                kaynak ve kanalları Şirket’in Kullanıcılar arasındaki sorunların çözümüne
                yönelik bir taahhüt olarak yorumlanamayacaktır.
              </li>

              <li>
                <strong>3.2.</strong> Şirket, İçerikler’in Platform’da yayınlanmasını herhangi
                bir gerekçe göstermeksizin reddedebilecektir. Herhangi bir İçerik’in Platform’da
                yayınlanması için Şirket tarafından onay verilmesi Şirket’in İçerikler’e ilişkin
                sorumsuzluğunun ortadan kalktığı şeklinde yorumlanmayacaktır. Şirket, işbu
                Sözleşme’nin sona ermesi veya feshedilmesinden sonra dahi ilgili İçerik’i
                yayınlamak veya yayından kaldırmak hususunda münhasır hak sahibi olacaktır.
              </li>

              <li>
                <strong>3.3.</strong> Kullanıcı, İçerik’i anlaşılır ve açık bir şekilde hazırlayarak
                Şirket’e tam ve güncel olarak sağlayacaktır. Şirket, ilgili İçerik kapsamında
                sunulan sair içeriklerin ve İçerik’lerin isimlendirildiği Etiket ve Kategoriler’in
                hukuka ve ahlaka aykırı olması, başkalarının şahsi, fikri ve ticari haklarına
                tecavüz edici nitelik taşıması veya Şirket’in bu yönde yapılan ihtarlara muhatap
                olması, İçerik içerisindeki tanımların yahut video veya fotoğrafların İçerik’i
                yansıtmaması veya başka şekillerde yanıltıcı nitelikte olması veya işbu Sözleşme
                ve Platform’da yer alan kural ve koşullara doğrudan veya dolaylı olarak aykırı
                olması gibi sebeplerle Kullanıcı’ya herhangi bir ihtarda bulunmadan İçerik’in
                yayınını geçici veya sürekli olarak durdurabilir.
              </li>

              <li>
                <strong>3.4.</strong> Kullanıcı, İçerik paylaşımı işlemlerine ilişkin olarak Şirket
                tarafından farklı kurallar belirlenebileceğini, her durumda İçerik paylaşımı işlemi
                bakımından ilgili işlem için Platform tarafından belirlenen genel kurallarla bağlı
                olacağını kabul eder.
              </li>

              <li>
                <strong>3.5.</strong> Kullanıcı, İçerik’i Platform harici herhangi bir platform
                vasıtasıyla veya herhangi bir yöntem ile üçüncü kişilerle paylaşmamayı, İçerik’e
                ilişkin hakları üçüncü kişilere devretmemeyi, İçerik’e herhangi bir şekilde zarar
                vermemeyi, İçerik’in kendisi ya da üçüncü kişiler tarafından zarar görmesini
                engellemek ve güvenliğini sağlamak için kendisinden beklenen her türlü makul tedbiri
                almayı kabul, beyan ve taahhüt eder. Kullanıcı, her durumda kendisine yöneltilecek
                yahut kendisinin yöneltebileceği talepler bakımından Şirket’in herhangi bir
                müdahalesinin ve bu kapsamda bir sorumluluğunun bulunmayacağını kabul eder.
              </li>

              <li>
                <strong>3.6.</strong> Kullanıcı, Platform’da sunduğu İçerikler’e ilişkin haklar ve
                yetkiler üzerinde çekişmesiz bir şekilde mutlak olarak tasarrufta bulunma hak ve
                yetkisine sahip olduğunu, İçerik’in paylaşılması ve İçerik’in hak ve yetkilerinin
                kendisi tarafından devredilmesine karşı herhangi bir hukuki veya fiili engel
                bulunmadığını, İçerik paylaşımının Sözleşme hükümlerince belirlenen veya Platform’un
                ilgili yerlerinde belirtilen, Platform’un ve Platform’da sunulan hizmetlerin kullanımına
                ilişkin kurallara ve üyeliğe ilişkin koşullara aykırı olmadığını ve yürürlükteki tüm
                mevzuata uygun olduğunu kabul ve taahhüt eder. İçerik’in herhangi bir şekilde yürürlükteki
                herhangi bir düzenlemeye aykırı olmasından dolayı doğabilecek her türlü hukuki, ticari ve
                idari talebe karşı sorumluluk ilgili Kullanıcı’ya ait olup, Kullanıcılar bu yönde Şirket’e
                yapılan taleplere karşı Şirket’i her türlü adli, ticari ve idari makam önünde savunmakla
                yükümlü olacaktır.
              </li>

              <li>
                <strong>3.7.</strong> Kullanıcı, Platform’da sunduğu İçerikler üzerinde sahip olduğu işleme,
                çoğaltma, yayma, temsil (doğrudan ve dolaylı olarak) ve işaret, ses ve/veya görüntü nakline
                yarayan araçlarla umuma iletim hakları (mali haklar) ile umuma arz, adın belirtilmesi ve
                eserde değişiklik yapılmasını men etme yetkilerini içeren manevi hakları kullanma yetkisini;
                her türlü ticari kullanım ile üçüncü gerçek veya tüzel kişilere devir yetkilerini de kapsar
                şekilde, herhangi bir süre, amaç, yer ve muhteva sınırlaması olmaksızın herhangi bir ücret
                veya karşılık talep etmeksizin, gayri kabili-i rücu Şirket’e devretmeyi taahhüt eder.
              </li>
            </ul>
          </div>
        </section>

        {/* 4 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              4. Sorumluluğun Sınırlandırılması
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="mb-0">
                  <strong>4.1.</strong> Şirket, Platform’a girilmesi, Platform’un ya da
                  Platform’daki bilgilerin ve diğer verilerin, programların vs.
                  kullanılması, hizmetlerden yararlanılması yahut Platform’da paylaşılan
                  İçerikler sebebiyle, Sözleşme’nin ihlali, haksız fiil ya da başkaca
                  sebeplere binaen, ağır kusuru dışında doğabilecek doğrudan ya da dolaylı
                  hiçbir zarardan sorumlu değildir. Şirket, Sözleşme’nin ihlali, haksız
                  fiil, ihmal veya diğer sebepler neticesinde; hata, ihmal, verilerin
                  silinmesi, kaybı, işlemin veya iletişimin gecikmesi, bilgisayar virüsü,
                  iletişim hatası, hırsızlık, imha, izinsiz olarak kayıtlara girilmesi,
                  kayıtların değiştirilmesi veya kullanılması hususunda herhangi bir
                  sorumluluk kabul etmez. Platform’a ya da link verilen sitelere
                  girilmesi, Platform’un kullanılması ile Kullanıcı’nın Platform’u ziyaret
                  etmesi ve kullanımı sonucunda doğabilecek her tür sorumluluktan,
                  mahkeme masrafları ve diğer masraflar da dahil olmak üzere Şirket’in her
                  tür zarar ve talep hakkından beri kılındığı kabul edilmektedir.
                </p>
              </div>

              {/* 4.2 Uyarı Kartı (Privacy tarzı) */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 mb-2">Önemli Bilgilendirme</h3>
                <p className="text-amber-900 text-sm mb-0">
                  <strong>4.2.</strong> Kullanıcı’nın Platform’u kullanması, Hizmetlerden
                  yararlanması ya da paylaşılan İçerikler’den faydalanması ile ilgili her
                  türlü risk münhasıran Kullanıcı üzerinde olacaktır. Kullanıcı, Platform’un
                  kullanımı ve Platform’da paylaşılan İçerikler’e ilişkin olarak Şirket’ten
                  hangi ad altında olursa olsun herhangi bir şekilde talepte bulunmayacağını,
                  Şirket’in İçerikler’e ilişkin herhangi bir garanti ya da taahhüt vermediğini
                  kabul, beyan ve taahhüt eder. Şirket, uygulanacak hukukun izin verdiği ölçüde,
                  kar kaybı, şerefiye ve itibar kaybı dahil ancak bunlarla sınırlı olmaksızın
                  Platform’un kullanımı ve/veya içerik paylaşımı neticesinde yahut Kullanıcılar’ın
                  fiilleri nedeniyle meydana gelen hiçbir doğrudan, dolaylı, özel, arızi, cezai
                  zarardan sorumlu olmayacaktır. Platform ve Platform üzerinden sunulan ürünler,
                  hizmetler ve sair içerikler “olduğu gibi” sunulmakta olup bu kapsamda Şirket’in
                  bunların doğruluğu, tamlığı ve güvenilirliği ile ilgili herhangi bir sorumluluk
                  ya da taahhüdü bulunmamaktadır. Şirket, işbu Sözleşme kapsamında ticari
                  elverişlilik, belli bir amaca veya kullanıma uygunluk veya ihlalin söz konusu
                  olmamasına ilişkin olarak açık veya zımni herhangi bir taahhütte bulunmamaktadır.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="mb-0">
                  <strong>4.3.</strong> Kullanıcı, Platform üzerinden Şirket’in kontrolünde
                  olmayan başka internet sitelerine ve/veya platformlara, dosyalara veya
                  içeriklere link verilebileceğini, üçüncü taraflara ait hizmetlerin
                  sunulabileceğini ve bu tür linklerin yöneldiği internet sitesini veya
                  işleten/hizmeti veren kişiyi desteklemek amacıyla veya internet sitesi
                  veya içerdiği bilgilere yönelik herhangi bir türde bir beyan veya garanti
                  niteliği taşımadığını, söz konusu linkler vasıtasıyla erişilen platformlar,
                  internet siteleri, dosyalar ve içerikler, hizmetler veya ürünler veya bunların
                  içeriği hakkında Şirket’in herhangi bir sorumluluğu olmadığını kabul ve beyan eder.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="mb-0">
                  <strong>4.4.</strong> Kullanıcı, Platform ve Platform üzerinden sunulan içeriklere
                  erişim ve bunların kalitesinin büyük ölçüde ilgili internet servis sağlayıcısından
                  temin edilen hizmetin kalitesine dayandığını ve söz konusu hizmet kalitesinden kaynaklı
                  sorunlarda Şirket’in herhangi bir sorumluluğunun bulunmadığını, Platform’un işleyişinin
                  kusurdan ari olmadığını ve zaman zaman teknik aksaklıklar veya erişim engelleriyle
                  karşılaşabileceğini bildiğini kabul ve beyan eder.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="mb-0">
                  <strong>4.5.</strong> Kullanıcı, Şirket’in Platform’a virüs veya başka türlü saldırıların
                  ve izinsiz erişimlerin olmayacağını veya Platform’a yahut Platform’a bilgi aktarılmayacağını
                  garanti etmediğini bildiğini kabul etmektedir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              5. Mücbir Sebepler
            </h2>
            <p className="mb-0">
              Mücbir sebep sayılan tüm durumlarda, Şirket işbu Sözleşme ile belirlenen
              edimlerinden herhangi birini geç veya eksik ifa etme veya ifa etmeme nedeniyle
              sorumlu tutulamaz. Mücbir sebep; doğal afet, isyan, savaş, grev, lokavt,
              telekomünikasyon altyapısından kaynaklanan arızalar, elektrik kesintisi ve kötü
              hava koşulları da dahil ve fakat bunlarla sınırlı olmamak kaydıyla ilgili Taraf’ın
              makul kontrolü haricinde gerçekleşen olaylar olarak yorumlanacaktır. Mücbir sebep
              süresince Taraflar’ın edimleri askıya alınır. Mücbir sebebin 1 (bir) aydan uzun
              sürmesi halinde işbu Sözleşme hakları ifa edilemeyen Tarafça feshedilebilecektir.
            </p>
          </div>
        </section>

        {/* 6 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              6. Sözleşme’nin Askıya Alınması, Devri ve Feshi
            </h2>

            <ul className="space-y-3 list-disc pl-5 marker:text-slate-300">
              <li>
                <strong>6.1.</strong> Kullanıcı’nın işbu Sözleşme’de yer alan hükümlere ve
                Platform’da beyan edilen kural ve şartlara uymaması, Kullanıcı’nın İçerik paylaşımı
                faaliyetleri başta olmak üzere Platform’daki faaliyetlerinin hukuki, teknik veya bilgi
                güvenliği anlamında risk oluşturması ya da üçüncü kişilerin şahsi ve ticari haklarına
                halel getirici mahiyette olması halinde Şirket, Kullanıcı’nın Platform’u kullanımını
                geçici veya sürekli olarak durdurabilir yahut Sözleşme’yi feshedebilir. Kullanıcı’nın
                bu nedenle Şirket’ten herhangi bir talebi söz konusu olamaz.
              </li>
              <li>
                <strong>6.2.</strong> Şirket dilediği zamanda Platform’u ve/veya işbu Sözleşme’yi süreli
                veya süresiz olarak askıya alabilecek, sona erdirebilecektir.
              </li>
              <li>
                <strong>6.3.</strong> Kullanıcı, işbu Sözleşme’yi ve/veya Sözleşme’den kaynaklanan hak ve
                yükümlülükleri Şirket’in açık yazılı onayı olmaksızın üçüncü kişilere devredemeyecektir.
                Şirket işbu Sözleşme’yi, Sözleşme’den kaynaklanan hak ve yükümlülükleri üçüncü kişilere
                devretme hakkına sahiptir.
              </li>
            </ul>
          </div>
        </section>

        {/* 7 */}
        <section className="mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              7. Uyuşmazlıkların Çözümü
            </h2>
            <p className="mb-0">
              Bu Sözleşme ile ilgili olarak çıkabilecek bütün uyuşmazlıklarda öncelikle işbu metinde
              yer alan hükümler, hüküm bulunmayan konularda ise Türkiye Cumhuriyeti Kanunları
              uygulanacaktır. Sözleşme’nin uygulanmasından kaynaklanan ihtilafların çözümünde İstanbul
              Merkez (Çağlayan) Mahkemeleri ve İcra Daireleri yetkili olacaktır.
            </p>
          </div>
        </section>

        {/* İletişim (Privacy stili) */}
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <h3 className="font-bold text-slate-800 mb-2">İletişim</h3>
          <p className="text-sm text-slate-600 mb-0">
            Sorularınız için{" "}
            <a
              href="mailto:iletisim@tariften.com"
              className="text-[#db4c3f] hover:underline font-medium"
            >
              iletisim@tariften.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
