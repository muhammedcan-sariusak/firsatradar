// ======================================================
// FIRSATRADAR
// PUBLIC APP
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://plamxtngolhofgiwntij.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_DcVjC7SXJ5vHtIH57bkMiQ_wyak6kSt";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// ELEMENTLER
// ======================================================

const dealGrid =
    document.getElementById("dealGrid");

const emptyMessage =
    document.getElementById("emptyMessage");

const searchInput =
    document.getElementById("searchInput");

const categoryButtons =
    document.querySelectorAll(".category");

const themeSwitch =
    document.getElementById("themeSwitch");


// ======================================================
// DURUM
// ======================================================

let selectedCategory = "Tümü";

let deals = [];


// ======================================================
// FIRSATLARI GETİR
// ======================================================

async function loadDeals() {

    dealGrid.innerHTML =
        "Fırsatlar yükleniyor...";

    emptyMessage.style.display =
        "none";


    const { data, error } =
        await supabaseClient
            .from("deals")
            .select("*")
            .eq(
                "published",
                true
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Fırsatlar alınamadı:",
            error
        );

        dealGrid.innerHTML = "";

        emptyMessage.style.display =
            "block";

        emptyMessage.textContent =
            "Fırsatlar yüklenirken hata oluştu.";

        return;
    }


    deals =
        data || [];


    showDeals();

}


// ======================================================
// FİYATI SAYIYA ÇEVİR
// ======================================================

function priceToNumber(price) {

    if (!price) {
        return 0;
    }


    return parseFloat(

        String(price)
            .replace("TL", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()

    ) || 0;

}


// ======================================================
// HTML GÜVENLİĞİ
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// FIRSATLARI GÖSTER
// ======================================================

function showDeals() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const filteredDeals =
        deals.filter(
            deal => {

                const categoryMatch =
                    selectedCategory === "Tümü" ||
                    deal.category === selectedCategory;


                const title =
                    deal.title
                        ? deal.title.toLowerCase()
                        : "";


                const category =
                    deal.category
                        ? deal.category.toLowerCase()
                        : "";


                const searchMatch =
                    title.includes(searchText) ||
                    category.includes(searchText);


                return (
                    categoryMatch &&
                    searchMatch
                );

            }
        );


    dealGrid.innerHTML = "";


    if (
        filteredDeals.length === 0
    ) {

        emptyMessage.style.display =
            "block";

        emptyMessage.textContent =
            searchText
                ? "Aradığın fırsat bulunamadı."
                : "Henüz fırsat bulunmuyor.";

        return;
    }


    emptyMessage.style.display =
        "none";


    filteredDeals.forEach(
        deal => {

            createDealCard(deal);

        }
    );

}


// ======================================================
// FIRSAT KARTI
// ======================================================

function createDealCard(deal) {

    const card =
        document.createElement("div");


    card.className =
        "deal-card";


    // ----------------------------------------------
    // İNDİRİM
    // ----------------------------------------------

    const oldPrice =
        priceToNumber(
            deal.old_price
        );


    const newPrice =
        priceToNumber(
            deal.new_price
        );


    let discountText = "";


    if (
        oldPrice > 0 &&
        newPrice > 0 &&
        oldPrice > newPrice
    ) {

        const discount =
            Math.round(

                (
                    (oldPrice - newPrice)
                    / oldPrice
                ) * 100

            );


        discountText = `

            <div class="discount">

                %${discount} indirim

            </div>

        `;

    }


    // ----------------------------------------------
    // GÖRSEL
    // ----------------------------------------------

    const imageHTML =
        deal.image_url

            ? `

                <img
                    src="${escapeHTML(
                        deal.image_url
                    )}"
                    alt="${escapeHTML(
                        deal.title
                    )}"
                    loading="lazy">

              `

            : `

                <span
                    style="font-size:60px;">

                    🛒

                </span>

              `;


    // ----------------------------------------------
    // TIKLAMA SAYISI
    // ----------------------------------------------

    const clickCount =
        Number(
            deal.click_count || 0
        );


    const clickText =
        clickCount === 1
            ? "👆 1 kişi tıkladı"
            : `👆 ${clickCount} kişi tıkladı`;


    // ----------------------------------------------
    // KART
    // ----------------------------------------------

    card.innerHTML = `

        <div class="deal-image">

            ${imageHTML}

        </div>


        <div class="deal-content">


            <div class="deal-category">

                ${escapeHTML(
                    deal.category
                )}

            </div>


            <h2>

                ${escapeHTML(
                    deal.title
                )}

            </h2>


            ${discountText}


            <div class="prices">

                ${
                    deal.old_price

                    ? `

                        <span class="old-price">

                            ${escapeHTML(
                                deal.old_price
                            )}

                        </span>

                      `

                    : ""
                }


                <span class="new-price">

                    ${escapeHTML(
                        deal.new_price
                    )}

                </span>

            </div>


            <div class="click-count">

                ${clickText}

            </div>


            <button
                class="deal-button"
                type="button">

                Fırsata Git →

            </button>


        </div>

    `;


    // ----------------------------------------------
    // FIRSATA GİT BUTONU
    // ----------------------------------------------

    const dealButton =
        card.querySelector(
            ".deal-button"
        );


    dealButton.addEventListener(
        "click",
        () => {

            openDeal(
                deal,
                dealButton
            );

        }
    );


    dealGrid.appendChild(card);

}


// ======================================================
// FIRSATA GİT
// ======================================================

async function openDeal(
    deal,
    button
) {

    if (!deal.affiliate_url) {

        return;
    }


    // Yeni sekmeyi kullanıcı tıklaması
    // sırasında açıyoruz.
    // Böylece tarayıcı popup engellemez.

    const newTab =
        window.open(
            "about:blank",
            "_blank"
        );


    // Popup engellendiyse normal sekmede aç

    if (!newTab) {

        window.location.href =
            deal.affiliate_url;

        return;
    }


    newTab.opener = null;


    // Butonu geçici olarak değiştir

    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        "Açılıyor...";


    try {

        // ------------------------------------------
        // TIKLAMA SAYISINI ARTIR
        // ------------------------------------------

        const { error } =
            await supabaseClient
                .rpc(
                    "increment_deal_click",
                    {
                        deal_id: deal.id
                    }
                );


        if (error) {

            console.error(
                "Tıklama kaydedilemedi:",
                error
            );

        }


        // ------------------------------------------
        // SAYACI EKRANDA ANINDA ARTIR
        // ------------------------------------------

        deal.click_count =
            Number(
                deal.click_count || 0
            ) + 1;


        // ------------------------------------------
        // ÜRÜN SAYFASINI AÇ
        // ------------------------------------------

        newTab.location.href =
            deal.affiliate_url;


    }

    catch (error) {

        console.error(
            "Tıklama sistemi hatası:",
            error
        );


        // Sistem hata verse bile
        // kullanıcı ürüne gidebilsin.

        newTab.location.href =
            deal.affiliate_url;

    }


    button.disabled =
        false;

    button.textContent =
        originalText;

}


// ======================================================
// KATEGORİLER
// ======================================================

categoryButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                categoryButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedCategory =
                    button.dataset.category;


                showDeals();

            }
        );

    }
);


// ======================================================
// ARAMA
// ======================================================

searchInput.addEventListener(
    "input",
    showDeals
);


// ======================================================
// TEMA
// ======================================================

const savedTheme =
    localStorage.getItem(
        "theme"
    );


if (
    savedTheme === "dark"
) {

    document.body.classList.add(
        "dark-theme"
    );

}


themeSwitch.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-theme"
        );


        const darkMode =
            document.body.classList.contains(
                "dark-theme"
            );


        localStorage.setItem(
            "theme",
            darkMode
                ? "dark"
                : "light"
        );

    }
);


// ======================================================
// BAŞLAT
// ======================================================

loadDeals();