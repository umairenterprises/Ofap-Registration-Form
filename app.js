// ⚙️ فائر بیس کنفیگریشن تفصیلات (Replace with your actual keys)

const firebaseConfig = {
  apiKey: "AIzaSyCm0ioszmIgJg_NEfqcTIpV_ZZxkQzyCYI",
  authDomain: "ofsp-registration-form.firebaseapp.com",
  projectId: "ofsp-registration-form",
  storageBucket: "ofsp-registration-form.firebasestorage.app",
  messagingSenderId: "912908545475",
  appId: "1:912908545475:web:4e4a8a156de0f2413ca176",
  measurementId: "G-XLRFW1Y3F8"
};

// Initialize Cloud Services
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🟢 آف لائن ڈیٹا پرسٹنس ایکٹیویشن (Offline Persistence for PWA capability)
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistence not supported by browser');
    }
});

let currentLang = 'ur';
let recordsCache = [];

// 📄 پیجز سوئچ کرنے کا لاجک
function switchPage(pageId) {
    document.querySelectorAll('main > section').forEach(sec => {
        sec.className = 'page-hidden bg-white p-6 rounded-2xl shadow-xl border border-slate-100';
    });
    const target = document.getElementById(pageId);
    target.className = 'page-active bg-white p-6 rounded-2xl shadow-xl border border-slate-100';
    
    if(pageId !== 'form-page') {
        document.getElementById('orphanForm').reset();
        document.getElementById('recordId').value = '';
        document.getElementById('form-header-title').innerText = currentLang === 'ur' ? "کفالتِ یتامیٰ پروگرام - بنیادی معلومات فارم" : "Orphan Care Program - Registration Form";
    }
}

// 🌍 زبان تبدیل کرنے کا فنکشن (Urdu <-> English)
function toggleLanguage() {
    currentLang = currentLang === 'ur' ? 'en' : 'ur';
    const htmlTag = document.getElementById('html-tag');
    const langBtn = document.getElementById('lang-btn');
    
    if (currentLang === 'en') {
        htmlTag.setAttribute('dir', 'ltr');
        htmlTag.classList.remove('urdu-font');
        langBtn.innerText = "اردو";
        document.getElementById('app-main-title').innerText = "Orphan Care Program Dashboard";
    } else {
        htmlTag.setAttribute('dir', 'rtl');
        htmlTag.classList.add('urdu-font');
        langBtn.innerText = "English";
        document.getElementById('app-main-title').innerText = "کفالتِ یتامیٰ ڈیش بورڈ";
    }

    // Translate UI Elements containing data attribute targets
    document.querySelectorAll('[data-ur]').forEach(el => {
        el.innerText = currentLang === 'ur' ? el.getAttribute('data-ur') : el.getAttribute('data-en');
    });
}

// 💾 فارم سبمٹ (Add یا Update) ہینڈلر
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('recordId').value;
    const docData = {
        // Child Info
        childName: document.getElementById('childName').value,
        regNo: document.getElementById('regNo').value,
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        hobby: document.getElementById('hobby').value,
        language: document.getElementById('language').value,
        futureAsp: document.getElementById('futureAsp').value,
        disability: document.getElementById('disability').value,
        
        // School Info
        schoolName: document.getElementById('schoolName').value,
        className: document.getElementById('className').value,
        schoolAddress: document.getElementById('schoolAddress').value,
        
        // Father Info
        fatherName: document.getElementById('fatherName').value,
        fatherDod: document.getElementById('fatherDod').value,
        fatherReasonDod: document.getElementById('fatherReasonDod').value,
        fatherPlaceDod: document.getElementById('fatherPlaceDod').value,
        fatherJob: document.getElementById('fatherJob').value,
        fatherCnic: document.getElementById('fatherCnic').value,
        
        // Mother Info
        motherName: document.getElementById('motherName').value,
        motherStatus: document.getElementById('motherStatus').value,
        motherCnic: document.getElementById('motherCnic').value,
        motherDod: document.getElementById('motherDod').value,
        motherReasonDod: document.getElementById('motherReasonDod').value,
        motherChildrenCount: document.getElementById('motherChildrenCount').value,
        motherEducation: document.getElementById('motherEducation').value,
        motherUnder12Count: document.getElementById('motherUnder12Count').value,
        motherHouseStatus: document.getElementById('motherHouseStatus').value,
        motherJobStatus: document.getElementById('motherJobStatus').value,
        motherJobDetails: document.getElementById('motherJobDetails').value,
        motherSkill: document.getElementById('motherSkill').value,
        motherIncomeSource: document.getElementById('motherIncomeSource').value,
        motherMobile: document.getElementById('motherMobile').value,
        motherCurrentAddress: document.getElementById('motherCurrentAddress').value,
        motherPermanentAddress: document.getElementById('motherPermanentAddress').value,
        
        // Guardian Info
        guardianName: document.getElementById('guardianName').value,
        guardianRelation: document.getElementById('guardianRelation').value,
        guardianCnic: document.getElementById('guardianCnic').value,
        guardianJob: document.getElementById('guardianJob').value,
        guardianMobile: document.getElementById('guardianMobile').value,
        guardianAddress: document.getElementById('guardianAddress').value,
        
        // Bank Info
        bankName: document.getElementById('bankName').value,
        bankBranchCode: document.getElementById('bankBranchCode').value,
        bankBranchAddress: document.getElementById('bankBranchAddress').value,
        bankAccountTitle: document.getElementById('bankAccountTitle').value,
        bankIban: document.getElementById('bankIban').value,
        
        // Checklist Docs Status
        docPhoto: document.getElementById('docPhoto').checked,
        docBirthCert: document.getElementById('docBirthCert').checked,
        docDeathCert: document.getElementById('docDeathCert').checked,
        docMotherCnic: document.getElementById('docMotherCnic').checked,
        docFatherCnic: document.getElementById('docFatherCnic').checked,
        docSchoolCert: document.getElementById('docSchoolCert').checked,
        
        lastUpdated: new Date().getTime()
    };

    try {
        if(id) {
            // Update mode
            await db.collection("orphans_records").doc(id).set(docData, { merge: true });
            alert(currentLang === 'ur' ? "ریکارڈ کامیابی سے اپڈیٹ ہو گیا!" : "Record updated successfully!");
        } else {
            // New entry creation mode
            await db.collection("orphans_records").add(docData);
            alert(currentLang === 'ur' ? "نیا ریکارڈ کامیابی سے محفوظ ہو گیا!" : "New record saved successfully!");
        }
        document.getElementById('orphanForm').reset();
        switchPage('records-page');
    } catch (err) {
        console.error("Database Write Error: ", err);
        alert("ڈیٹا محفوظ کرنے میں خرابی پیش آئی۔ لوکل اسٹوریج فعال ہے۔");
    }
}

// 🔄 ریئل ٹائم ڈیٹا مانیٹرنگ اور ٹیبل اپڈیٹس
db.collection("orphans_records").orderBy("lastUpdated", "desc").onSnapshot((snapshot) => {
    recordsCache = [];
    const tbody = document.getElementById('records-tbody');
    tbody.innerHTML = '';

    if(snapshot.empty) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">کوئی ریکارڈ دستیاب نہیں ہے</td></tr>`;
        return;
    }

    snapshot.forEach((doc) => {
        const item = doc.data();
        item.id = doc.id;
        recordsCache.push(item);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 text-center font-semibold text-slate-700">${item.regNo}</td>
            <td class="p-3 font-bold text-slate-900">${item.childName}</td>
            <td class="p-3 text-slate-600">${item.fatherName || 'N/A'}</td>
            <td class="p-3 text-slate-600">${item.motherMobile || 'N/A'}</td>
            <td class="p-3 text-center space-x-1 space-x-reverse">
                <button onclick="editRecord('${item.id}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 px-3 rounded-md transition cursor-pointer">ایڈٹ</button>
                <button onclick="downloadPDF('${item.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-md transition cursor-pointer">PDF</button>
                <button onclick="deleteRecord('${item.id}')" class="bg-rose-600 hover:bg-rose-700 text-white text-xs py-1.5 px-3 rounded-md transition cursor-pointer">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
});

// 🔎 لائیو سرچ فلٹر فنکشن
function filterRecords() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.querySelectorAll('#records-tbody tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// 📝 ایڈٹ موڈ فعال کرنا
function editRecord(id) {
    const data = recordsCache.find(r => r.id === id);
    if(!data) return;

    document.getElementById('recordId').value = data.id;
    
    // Auto populate fields
    document.getElementById('childName').value = data.childName || '';
    document.getElementById('regNo').value = data.regNo || '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('dob').value = data.dob || '';
    document.getElementById('hobby').value = data.hobby || '';
    document.getElementById('language').value = data.language || 'اردو';
    document.getElementById('futureAsp').value = data.futureAsp || '';
    document.getElementById('disability').value = data.disability || '';
    
    document.getElementById('schoolName').value = data.schoolName || '';
    document.getElementById('className').value = data.className || '';
    document.getElementById('schoolAddress').value = data.schoolAddress || '';
    
    document.getElementById('fatherName').value = data.fatherName || '';
    document.getElementById('fatherDod').value = data.fatherDod || '';
    document.getElementById('fatherReasonDod').value = data.fatherReasonDod || '';
    document.getElementById('fatherPlaceDod').value = data.fatherPlaceDod || '';
    document.getElementById('fatherJob').value = data.fatherJob || '';
    document.getElementById('fatherCnic').value = data.fatherCnic || '';
    
    document.getElementById('motherName').value = data.motherName || '';
    document.getElementById('motherStatus').value = data.motherStatus || '';
    document.getElementById('motherCnic').value = data.motherCnic || '';
    document.getElementById('motherDod').value = data.motherDod || '';
    document.getElementById('motherReasonDod').value = data.motherReasonDod || '';
    document.getElementById('motherChildrenCount').value = data.motherChildrenCount || '';
    document.getElementById('motherEducation').value = data.motherEducation || '';
    document.getElementById('motherUnder12Count').value = data.motherUnder12Count || '';
    document.getElementById('motherHouseStatus').value = data.motherHouseStatus || '';
    document.getElementById('motherJobStatus').value = data.motherJobStatus || '';
    document.getElementById('motherJobDetails').value = data.motherJobDetails || '';
    document.getElementById('motherSkill').value = data.motherSkill || '';
    document.getElementById('motherIncomeSource').value = data.motherIncomeSource || '';
    document.getElementById('motherMobile').value = data.motherMobile || '';
    document.getElementById('motherCurrentAddress').value = data.motherCurrentAddress || '';
    document.getElementById('motherPermanentAddress').value = data.motherPermanentAddress || '';
    
    document.getElementById('guardianName').value = data.guardianName || '';
    document.getElementById('guardianRelation').value = data.guardianRelation || '';
    document.getElementById('guardianCnic').value = data.guardianCnic || '';
    document.getElementById('guardianJob').value = data.guardianJob || '';
    document.getElementById('guardianMobile').value = data.guardianMobile || '';
    document.getElementById('guardianAddress').value = data.guardianAddress || '';
    
    document.getElementById('bankName').value = data.bankName || '';
    document.getElementById('bankBranchCode').value = data.bankBranchCode || '';
    document.getElementById('bankBranchAddress').value = data.bankBranchAddress || '';
    document.getElementById('bankAccountTitle').value = data.bankAccountTitle || '';
    document.getElementById('bankIban').value = data.bankIban || '';
    
    document.getElementById('docPhoto').checked = !!data.docPhoto;
    document.getElementById('docBirthCert').checked = !!data.docBirthCert;
    document.getElementById('docDeathCert').checked = !!data.docDeathCert;
    document.getElementById('docMotherCnic').checked = !!data.docMotherCnic;
    document.getElementById('docFatherCnic').checked = !!data.docFatherCnic;
    document.getElementById('docSchoolCert').checked = !!data.docSchoolCert;

    document.getElementById('form-header-title').innerText = "ریکارڈ تبدیل کریں / Edit Record Profile";
    switchPage('form-page');
}

// ❌ ڈیلیٹ ریکارڈ لاجک
async function deleteRecord(id) {
    if(confirm(currentLang === 'ur' ? "کیا آپ واقعی یہ ڈیٹا حذف کرنا چاہتے ہیں؟" : "Are you sure to delete this record permanent?")) {
        await db.collection("orphans_records").doc(id).delete();
    }
}

// 📄 مخصوص ڈیٹا کی پروفیشنل A4 سائز پی ڈی ایف ڈاؤن لوڈر
function downloadPDF(id) {
    const data = recordsCache.find(r => r.id === id);
    if (!data) return;

    const dynamicContent = document.getElementById('pdf-dynamic-content');
    
    // Layout Structure for Printable Table Matching Official AlKhidmat Style
    dynamicContent.innerHTML = `
        <table class="w-full border-2 border-slate-800 text-sm" style="border-collapse: collapse;">
            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">بچے کی بنیادی معلومات</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold w-1/4">بچے کا نام:</td><td class="p-2 border border-slate-800 w-1/4">${data.childName}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold w-1/4">رجسٹریشن نمبر:</td><td class="p-2 border border-slate-800 w-1/4">${data.regNo}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">جنس:</td><td class="p-2 border border-slate-800">${data.gender}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">تاریخِ پیدائش:</td><td class="p-2 border border-slate-800">${data.dob}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">پسندیدہ مشغلہ:</td><td class="p-2 border border-slate-800">${data.hobby || '-'}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">زبان / معذوری:</td><td class="p-2 border border-slate-800">${data.language} / ${data.disability}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">مستقبل کی خواہش:</td><td class="p-2 border border-slate-800" colspan="3">${data.futureAsp || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">بچے کی تعلیمی معلومات برائے اسکول</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">اسکول کا نام:</td><td class="p-2 border border-slate-800">${data.schoolName || '-'}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">کلاس / درجہ:</td><td class="p-2 border border-slate-800">${data.className || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">اسکول کا پتہ:</td><td class="p-2 border border-slate-800" colspan="3">${data.schoolAddress || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">والد کی تفصیلات (مرحوم)</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">والد کا نام:</td><td class="p-2 border border-slate-800">${data.fatherName || '-'}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">تاریخِ وفات:</td><td class="p-2 border border-slate-800">${data.fatherDod || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">وجہِ وفات / مقام:</td><td class="p-2 border border-slate-800">${data.fatherReasonDod || '-'} / ${data.fatherPlaceDod || '-'}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">پیشہ / شناختی کارڈ:</td><td class="p-2 border border-slate-800">${data.fatherJob || '-'} / ${data.fatherCnic || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">والدہ کی تفصیلات</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">والدہ کا نام / اسٹیٹس:</td><td class="p-2 border border-slate-800">${data.motherName || '-'} (${data.motherStatus})</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">والدہ کا CNIC:</td><td class="p-2 border border-slate-800">${data.motherCnic || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">بچوں کی کل تعداد / &lt; 12 سال:</td><td class="p-2 border border-slate-800">${data.motherChildrenCount || 0} / ${data.motherUnder12Count || 0}</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">تعلیم / مکان:</td><td class="p-2 border border-slate-800">${data.motherEducation || '-'} / ${data.motherHouseStatus}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">ملازمت / ہنر / آمدن:</td><td class="p-2 border border-slate-800" colspan="3">${data.motherJobStatus} (${data.motherJobDetails || '-'}) | ہنر: ${data.motherSkill || '-'} | آمدن: ${data.motherIncomeSource || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">رابطہ نمبر:</td><td class="p-2 border border-slate-800" colspan="3">${data.motherMobile || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">موجودہ پتہ:</td><td class="p-2 border border-slate-800" colspan="3">${data.motherCurrentAddress || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">سرپرست کی تفصیلات</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">سرپرست کا نام / رشتہ:</td><td class="p-2 border border-slate-800">${data.guardianName || '-'} (${data.guardianRelation || '-'})</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">شناختی کارڈ / موبائل:</td><td class="p-2 border border-slate-800">${data.guardianCnic || '-'} / ${data.guardianMobile || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">بینک اکاؤنٹ کی تفصیلات</th></tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">بینک / برانچ کوڈ:</td><td class="p-2 border border-slate-800">${data.bankName || '-'} (${data.bankBranchCode || '-'})</td>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">اکاؤنٹ ٹائٹل:</td><td class="p-2 border border-slate-800">${data.bankAccountTitle || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-800 bg-slate-50 font-bold">IBAN نمبر:</td><td class="p-2 border border-slate-800" colspan="3">${data.bankIban || '-'}</td>
            </tr>

            <tr class="bg-slate-200"><th colspan="4" class="p-2 text-center font-bold border border-slate-800 text-base">دستاویزات کی فراہمی چیک لسٹ</th></tr>
            <tr>
                <td class="p-2 border border-slate-800" colspan="4">
                    بچے کی تصویر: <b>${data.docPhoto ? 'فراہم کی گئی ہے' : 'نہیں ہے'}</b> | 
                    ب فارم: <b>${data.docBirthCert ? 'فراہم کی گئی ہے' : 'نہیں ہے'}</b> | 
                    ڈیتھ سرٹیفکیٹ: <b>${data.docDeathCert ? 'فراہم کی گئی ہے' : 'نہیں ہے'}</b> | 
                    والدہ شناختی کارڈ: <b>${data.docMotherCnic ? 'فراہم کی گئی ہے' : 'نہیں ہے'}</b> | 
                    اسکول سرٹیفکیٹ: <b>${data.docSchoolCert ? 'منسلک ہے' : 'منسلک نہیں ہے'}</b>
                </td>
            </tr>
        </table>
    `;

    const printElement = document.getElementById('pdf-container');
    printElement.classList.remove('hidden');

    const conversionOptions = {
        margin:       12,
        filename:     `AlKhidmat_Form_${data.regNo}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Trigger PDF compilation and hide layout container after generation completes
    html2pdf().set(conversionOptions).from(printElement).save().then(() => {
        printElement.classList.add('hidden');
    });
}

// 📊 تمام ڈیٹا یکجا طور پر ایکسیل (Excel) شیٹ میں ایکسپورٹ کرنے کا لاجک
function exportToExcel() {
    if(recordsCache.length === 0) {
        alert("ایکسپورٹ کرنے کے لیے کوئی ریکارڈ موجود نہیں ہے!");
        return;
    }
    
    // Eliminate firebase dynamic fields before user download
    const cleanList = recordsCache.map(({id, lastUpdated, ...actualFields}) => actualFields);
    
    const worksheet = XLSX.utils.json_to_sheet(cleanList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orphan Database");
    XLSX.writeFile(workbook, "AlKhidmat_Orphans_Master_Report.xlsx");
}

// 🌐 Progressive Web App (PWA) Service Worker Initialization
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA Offline Service Worker: Active'))
            .catch(err => console.error('Service Worker Fault: ', err));
    });
}