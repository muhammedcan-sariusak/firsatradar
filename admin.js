// ==========================================
// FIRSAT RADAR - ADMIN.JS
// ==========================================


// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://plamxtngolhofgiwntij.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_DcVjC7SXJ5vHtIH57bkMiQ_wyak6kSt";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// ELEMENTLER
// ==========================================

const loginSection =
    document.getElementById("loginSection");

const adminPanel =
    document.getElementById("adminPanel");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const logoutBtn =
    document.getElementById("logoutBtn");

const dealForm =
    document.getElementById("dealForm");

const titleInput =
    document.getElementById("title");

const categoryInput =
    document.getElementById("category");

const oldPriceInput =
    document.getElementById("oldPrice");

const newPriceInput =
    document.getElementById("newPrice");

const affiliateUrlInput =
    document.getElementById("affiliateUrl");

const descriptionInput =
    document.getElementById("description");

const imageInput =
    document.getElementById("image");

const imagePreview =
    document.getElementById("imagePreview");

const saveBtn =
    document.getElementById("saveBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const dealsList =
    document.getElementById("dealsList");


let editingDealId = null;

let selectedImageFile = null;


// ==========================================
// SAYFA AÇILINCA OTURUM KONTROLÜ
// ==========================================

checkSession();


async function checkSession() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();


    if (session) {

        showAdminPanel();

    } else {

        showLogin();

    }

}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            const {
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email,
                    password

                });


            if (error) {

                alert(
                    "Giriş başarısız:\n" +
                    error.message
                );

                return;

            }


            showAdminPanel();

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            showLogin();

        }
    );

}


// ==========================================
// LOGIN / ADMIN GÖSTER
// ==========================================

function showLogin() {

    if (loginSection) {

        loginSection.style.display =
            "block";

    }


    if (adminPanel) {

        adminPanel.style.display =
            "none";

    }

}


function showAdminPanel() {

    if (loginSection) {

        loginSection.style.display =
            "none";

    }


    if (adminPanel) {

        adminPanel.style.display =
            "block";

    }


    loadDeals();

    loadAnalytics();

}


// ==========================================
// MANUEL RESİM SEÇİMİ
// ==========================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            selectedImageFile =
                imageInput.files[0];


            if (!selectedImageFile) {

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    if (imagePreview) {

                        imagePreview.src =
                            e.target.result;

                        imagePreview.style.display =
                            "block";

                    }

                };


            reader.readAsDataURL(
                selectedImageFile
            );

        }
    );

}


// ==========================================
// MANUEL RESİM YÜKLEME
// ==========================================

async function uploadImage(file) {

    if (!file) {

        return null;

    }


    const extension =
        file.name
            .split(".")
            .pop();


    const fileName =
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2) +
        "." +
        extension;


    const filePath =
        "products/" +
        fileName;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from("product-images")
            .upload(
                filePath,
                file,
                {
                    upsert: false
                }
            );


    if (error) {

        console.error(
            "Manuel resim yükleme hatası:",
            error
        );

        alert(
            "Resim yüklenemedi:\n" +
            error.message
        );

        return null;

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(
                filePath
            );


    return data.publicUrl;

}


// ==========================================
// ÜRÜN LİNKİNDEN OTOMATİK FOTOĞRAF
// ==========================================

async function getProductImage(productUrl) {

    if (!productUrl) {

        return null;

    }


    console.log(
        "================================"
    );

    console.log(
        "FOTOĞRAF FONKSİYONU ÇALIŞTI"
    );

    console.log(
        "Ürün linki:",
        productUrl
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "get-product-image",
                {
                    body: {
                        url: productUrl
                    }
                }
            );


        console.log(
            "FOTOĞRAF CEVABI:",
            data
        );


        console.log(
            "FOTOĞRAF HATASI:",
            error
        );


        if (error) {

            console.error(
                "Edge Function hatası:",
                error
            );

            return null;

        }


        if (!data) {

            console.warn(
                "Edge Function boş cevap verdi."
            );

            return null;

        }


        if (!data.success) {

            console.warn(
                "Fotoğraf bulunamadı:",
                data.error
            );

            return null;

        }


        if (!data.image_url) {

            console.warn(
                "image_url boş geldi."
            );

            return null;

        }


        console.log(
            "FOTOĞRAF BULUNDU:",
            data.image_url
        );


        console.log(
            "================================"
        );


        return data.image_url;


    } catch (error) {

        console.error(
            "Otomatik fotoğraf alma hatası:",
            error
        );

        return null;

    }

}


// ==========================================
// FIRSAT KAYDET / GÜNCELLE
// ==========================================

if (dealForm) {

    dealForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const title =
                titleInput.value.trim();


            const category =
                categoryInput.value;


            const oldPrice =
                oldPriceInput.value.trim();


            const newPrice =
                newPriceInput.value.trim();


            const affiliateUrl =
                affiliateUrlInput.value.trim();


            const description =
                descriptionInput.value.trim();


            if (
                !title ||
                !category ||
                !newPrice ||
                !affiliateUrl
            ) {

                alert(
                    "Lütfen gerekli alanları doldur."
                );

                return;

            }


            saveBtn.disabled = true;


            saveBtn.textContent =
                editingDealId
                    ? "Güncelleniyor..."
                    : "Fotoğraf bulunuyor...";


            try {

                // ==================================
                // ÖNCE ÜRÜN LİNKİNDEN FOTOĞRAF BUL
                // ==================================

                let imageUrl =
                    await getProductImage(
                        affiliateUrl
                    );


                // ==================================
                // BULAMAZSA MANUEL FOTOĞRAFI DENE
                // ==================================

                if (
                    !imageUrl &&
                    selectedImageFile
                ) {

                    saveBtn.textContent =
                        "Resim yükleniyor...";


                    imageUrl =
                        await uploadImage(
                            selectedImageFile
                        );

                }


                // ==================================
                // YENİ FIRSATTA FOTOĞRAF BULUNAMADI
                // ==================================

                if (
                    !imageUrl &&
                    !editingDealId
                ) {

                    const devam =
                        confirm(
                            "Ürün fotoğrafı otomatik bulunamadı.\n\n" +
                            "Yine de fotoğrafsız olarak fırsatı eklemek istiyor musun?"
                        );


                    if (!devam) {

                        saveBtn.disabled =
                            false;

                        saveBtn.textContent =
                            "Fırsatı Kaydet";

                        return;

                    }

                }


                saveBtn.textContent =
                    editingDealId
                        ? "Güncelleniyor..."
                        : "Fırsat kaydediliyor...";


                // ==================================
                // GÜNCELLEME
                // ==================================

                if (editingDealId) {

                    const updateData = {

                        title,

                        category,

                        old_price:
                            oldPrice,

                        new_price:
                            newPrice,

                        affiliate_url:
                            affiliateUrl,

                        description

                    };


                    if (imageUrl) {

                        updateData.image_url =
                            imageUrl;

                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from("deals")
                            .update(
                                updateData
                            )
                            .eq(
                                "id",
                                editingDealId
                            );


                    if (error) {

                        throw error;

                    }


                    alert(
                        "Fırsat güncellendi."
                    );

                }


                // ==================================
                // YENİ EKLEME
                // ==================================

                else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("deals")
                            .insert({

                                title,

                                category,

                                old_price:
                                    oldPrice,

                                new_price:
                                    newPrice,

                                affiliate_url:
                                    affiliateUrl,

                                description,

                                image_url:
                                    imageUrl,

                                published:
                                    true

                            });


                    if (error) {

                        throw error;

                    }


                    alert(
                        "Fırsat başarıyla eklendi."
                    );

                }


                resetForm();

                await loadDeals();

                await loadAnalytics();


            } catch (error) {

                console.error(
                    "Fırsat kaydetme hatası:",
                    error
                );


                alert(
                    "İşlem sırasında hata oluştu:\n" +
                    error.message
                );


            } finally {

                saveBtn.disabled =
                    false;


                saveBtn.textContent =
                    editingDealId
                        ? "Güncelle"
                        : "Fırsatı Kaydet";

            }

        }
    );

}


// ==========================================
// FIRSATLARI GETİR
// ==========================================

async function loadDeals() {

    if (!dealsList) {

        return;

    }


    dealsList.innerHTML =
        "<p>Fırsatlar yükleniyor...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("deals")
            .select(
                "id,title,category,old_price,new_price,image_url,affiliate_url,description,published,click_count,created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            error
        );


        dealsList.innerHTML =
            "<p>Fırsatlar yüklenemedi.</p>";

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        dealsList.innerHTML =
            "<p>Henüz fırsat eklenmemiş.</p>";

        return;

    }


    dealsList.innerHTML =
        "";


    data.forEach(
        deal => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "admin-deal-item";


            item.innerHTML = `

                <div style="
                    display:flex;
                    gap:15px;
                    align-items:center;
                    width:100%;
                ">

                    ${
                        deal.image_url
                        ?
                        `<img
                            src="${escapeHtml(deal.image_url)}"
                            style="
                                width:80px;
                                height:80px;
                                object-fit:cover;
                                border-radius:10px;
                            "
                        >`
                        :
                        `
                        <div style="
                            width:80px;
                            height:80px;
                            border-radius:10px;
                            background:#eee;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:25px;
                        ">
                            📷
                        </div>
                        `
                    }


                    <div style="
                        flex:1;
                    ">

                        <strong>
                            ${escapeHtml(
                                deal.title
                            )}
                        </strong>


                        <div style="
                            margin-top:5px;
                            opacity:.7;
                        ">

                            ${escapeHtml(
                                deal.category
                            )}

                        </div>


                        <div style="
                            margin-top:5px;
                        ">

                            <b>
                                ${escapeHtml(
                                    deal.new_price
                                )}
                            </b>


                            ${
                                deal.old_price
                                ?
                                `<span style="
                                    text-decoration:line-through;
                                    opacity:.5;
                                    margin-left:8px;
                                ">
                                    ${escapeHtml(
                                        deal.old_price
                                    )}
                                </span>`
                                :
                                ""
                            }

                        </div>


                        <div style="
                            margin-top:5px;
                            font-size:13px;
                            opacity:.7;
                        ">

                            👆
                            ${deal.click_count || 0}
                            tıklama

                        </div>

                    </div>


                    <div style="
                        display:flex;
                        gap:8px;
                    ">

                        <button
                            onclick="editDeal(${deal.id})"
                        >
                            Düzenle
                        </button>


                        <button
                            onclick="deleteDeal(${deal.id})"
                        >
                            Sil
                        </button>

                    </div>

                </div>

            `;


            dealsList.appendChild(
                item
            );

        }
    );

}


// ==========================================
// DÜZENLE
// ==========================================

async function editDeal(id) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("deals")
            .select("*")
            .eq(
                "id",
                id
            )
            .single();


    if (error) {

        alert(
            "Fırsat alınamadı:\n" +
            error.message
        );

        return;

    }


    editingDealId =
        id;


    titleInput.value =
        data.title || "";


    categoryInput.value =
        data.category || "";


    oldPriceInput.value =
        data.old_price || "";


    newPriceInput.value =
        data.new_price || "";


    affiliateUrlInput.value =
        data.affiliate_url || "";


    descriptionInput.value =
        data.description || "";


    selectedImageFile =
        null;


    if (imagePreview) {

        if (data.image_url) {

            imagePreview.src =
                data.image_url;

            imagePreview.style.display =
                "block";

        } else {

            imagePreview.src =
                "";

            imagePreview.style.display =
                "none";

        }

    }


    if (saveBtn) {

        saveBtn.textContent =
            "Güncelle";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "inline-block";

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// SİL
// ==========================================

async function deleteDeal(id) {

    const confirmed =
        confirm(
            "Bu fırsatı silmek istediğine emin misin?"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("deals")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "Silme işlemi başarısız:\n" +
            error.message
        );

        return;

    }


    alert(
        "Fırsat silindi."
    );


    await loadDeals();

    await loadAnalytics();

}


// ==========================================
// FORM SIFIRLA
// ==========================================

function resetForm() {

    editingDealId =
        null;


    selectedImageFile =
        null;


    if (dealForm) {

        dealForm.reset();

    }


    if (imagePreview) {

        imagePreview.src =
            "";

        imagePreview.style.display =
            "none";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "none";

    }


    if (saveBtn) {

        saveBtn.textContent =
            "Fırsatı Kaydet";

    }

}


// ==========================================
// İPTAL
// ==========================================

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        function () {

            resetForm();

        }
    );

}


// ==========================================
// ANALYTICS
// ==========================================

async function loadAnalytics() {

    try {

        const {
            data: visits,
            error: visitsError
        } =
            await supabaseClient
                .from("site_visits")
                .select(
                    "visitor_id,visited_at"
                );


        if (visitsError) {

            console.error(
                visitsError
            );

            return;

        }


        const {
            data: deals,
            error: dealsError
        } =
            await supabaseClient
                .from("deals")
                .select(
                    "id,title,click_count,published"
                );


        if (dealsError) {

            console.error(
                dealsError
            );

            return;

        }


        calculateAnalytics(
            visits || [],
            deals || []
        );


    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

    }

}


// ==========================================
// ANALYTICS HESAPLA
// ==========================================

function calculateAnalytics(
    visits,
    deals
) {

    const now =
        new Date();


    const today =
        dateOnly(now);


    const yesterday =
        dateOnly(
            new Date(
                now.getTime()
                -
                86400000
            )
        );


    const dailyVisitors =
        {};


    const hourlyVisitors =
        {};


    visits.forEach(
        visit => {

            const date =
                new Date(
                    visit.visited_at
                );


            const day =
                dateOnly(date);


            if (
                !dailyVisitors[day]
            ) {

                dailyVisitors[day] =
                    new Set();

            }


            dailyVisitors[day].add(
                visit.visitor_id
            );


            if (
                day === today
            ) {

                const hour =
                    date.getHours();


                if (
                    !hourlyVisitors[hour]
                ) {

                    hourlyVisitors[hour] =
                        new Set();

                }


                hourlyVisitors[hour].add(
                    visit.visitor_id
                );

            }

        }
    );


    // BUGÜN

    setText(
        "todayVisitors",
        dailyVisitors[today]
            ? dailyVisitors[today].size
            : 0
    );


    // DÜN

    setText(
        "yesterdayVisitors",
        dailyVisitors[yesterday]
            ? dailyVisitors[yesterday].size
            : 0
    );


    // SON 7 GÜN

    let last7 =
        0;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const d =
            new Date(
                now.getTime()
                -
                i * 86400000
            );


        const key =
            dateOnly(d);


        last7 +=
            dailyVisitors[key]
                ? dailyVisitors[key].size
                : 0;

    }


    setText(
        "last7Visitors",
        last7
    );


    // SON 30 GÜN

    let last30 =
        0;


    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const d =
            new Date(
                now.getTime()
                -
                i * 86400000
            );


        const key =
            dateOnly(d);


        last30 +=
            dailyVisitors[key]
                ? dailyVisitors[key].size
                : 0;

    }


    setText(
        "last30Visitors",
        last30
    );


    // TOPLAM ZİYARET

    setText(
        "totalVisits",
        visits.length
    );


    // TOPLAM TIKLAMA

    const totalClicks =
        deals.reduce(
            (
                sum,
                deal
            ) =>
                sum +
                (
                    deal.click_count ||
                    0
                ),
            0
        );


    setText(
        "totalClicks",
        totalClicks
    );


    // AKTİF FIRSATLAR

    const activeDeals =
        deals.filter(
            deal =>
                deal.published === true
        ).length;


    setText(
        "activeDeals",
        activeDeals
    );


    // EN ÇOK TIKLANAN

    const sortedDeals =
        [...deals].sort(
            (a, b) =>
                (
                    b.click_count || 0
                )
                -
                (
                    a.click_count || 0
                )
        );


    const topDeal =
        sortedDeals[0];


    if (topDeal) {

        setText(
            "topClickedDeal",

            topDeal.title +
            " (" +
            (
                topDeal.click_count ||
                0
            ) +
            " tıklama)"
        );

    } else {

        setText(
            "topClickedDeal",
            "Henüz tıklama yok"
        );

    }


    drawDailyChart(
        dailyVisitors
    );


    drawHourlyChart(
        hourlyVisitors
    );


    setText(
        "lastUpdate",
        now.toLocaleTimeString(
            "tr-TR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )
    );

}


// ==========================================
// GÜNLÜK GRAFİK
// ==========================================

function drawDailyChart(
    dailyVisitors
) {

    const canvas =
        document.getElementById(
            "dailyChart"
        );


    if (!canvas) {

        return;

    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.width =
            canvas.clientWidth * 2;


    const height =
        canvas.height =
            canvas.clientHeight * 2;


    ctx.scale(
        2,
        2
    );


    const w =
        width / 2;


    const h =
        height / 2;


    ctx.clearRect(
        0,
        0,
        w,
        h
    );


    const values =
        [];


    for (
        let i = 29;
        i >= 0;
        i--
    ) {

        const d =
            new Date(
                Date.now()
                -
                i * 86400000
            );


        const key =
            dateOnly(d);


        values.push(
            dailyVisitors[key]
                ? dailyVisitors[key].size
                : 0
        );

    }


    const max =
        Math.max(
            ...values,
            1
        );


    const padding =
        30;


    ctx.beginPath();


    values.forEach(
        (
            value,
            index
        ) => {

            const x =
                padding +
                (
                    index /
                    (
                        values.length -
                        1
                    )
                ) *
                (
                    w -
                    padding * 2
                );


            const y =
                h -
                padding -
                (
                    value /
                    max
                ) *
                (
                    h -
                    padding * 2
                );


            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.stroke();


    values.forEach(
        (
            value,
            index
        ) => {

            const x =
                padding +
                (
                    index /
                    (
                        values.length -
                        1
                    )
                ) *
                (
                    w -
                    padding * 2
                );


            const y =
                h -
                padding -
                (
                    value /
                    max
                ) *
                (
                    h -
                    padding * 2
                );


            ctx.beginPath();


            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );


            ctx.fill();

        }
    );

}


// ==========================================
// SAATLİK GRAFİK
// ==========================================

function drawHourlyChart(
    hourlyVisitors
) {

    const canvas =
        document.getElementById(
            "hourlyChart"
        );


    if (!canvas) {

        return;

    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.width =
            canvas.clientWidth * 2;


    const height =
        canvas.height =
            canvas.clientHeight * 2;


    ctx.scale(
        2,
        2
    );


    const w =
        width / 2;


    const h =
        height / 2;


    ctx.clearRect(
        0,
        0,
        w,
        h
    );


    const values =
        [];


    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        values.push(
            hourlyVisitors[hour]
                ? hourlyVisitors[hour].size
                : 0
        );

    }


    const max =
        Math.max(
            ...values,
            1
        );


    const padding =
        25;


    const barWidth =
        (
            w -
            padding * 2
        ) /
        24;


    values.forEach(
        (
            value,
            hour
        ) => {

            const barHeight =
                (
                    value /
                    max
                ) *
                (
                    h -
                    padding * 2
                );


            const x =
                padding +
                hour *
                barWidth;


            const y =
                h -
                padding -
                barHeight;


            ctx.fillRect(
                x + 2,
                y,
                barWidth - 4,
                barHeight
            );

        }
    );

}


// ==========================================
// YARDIMCI
// ==========================================

function dateOnly(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function escapeHtml(
    text
) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";

    }


    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// GLOBAL EDIT / DELETE
// ==========================================

window.editDeal =
    editDeal;


window.deleteDeal =
    deleteDeal;