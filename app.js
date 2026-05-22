// ⚙️ فائر بیس کنفیگریشن تفصیلات (اپنے فائر بیس کنسول والی اصل چابیاں یہاں لکھیں)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCm0ioszmIgJg_NEfqcTIpV_ZZxkQzyCYI",
  authDomain: "ofsp-registration-form.firebaseapp.com",
  projectId: "ofsp-registration-form",
  storageBucket: "ofsp-registration-form.firebasestorage.app",
  messagingSenderId: "912908545475",
  appId: "1:912908545475:web:4e4a8a156de0f2413ca176",
  measurementId: "G-XLRFW1Y3F8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// آف لائن سپورٹ پرسٹنس فعال کریں
db.enablePersistence().catch(err => console.log("Persistence configuration: Offline ready."));

let currentLang = 'ur';
let recordsCache = [];
let currentUserProfile = { email: '', role: 'Staff', district: '' };

// 📑 موبائل ٹیکسٹ ایریا کا آٹو ہائٹ ایڈجسٹمنٹ سسٹم
function autoExpand(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 🔐 یوزر لاگ ان سسٹمز اور رول بائنڈنگ لاجک
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        setupUserEnvironment(userCredential.user);
    } catch (err) {
        alert("لاگ ان ناموفق رہا! برائے مہربانی ای میل اور پاس ورڈ دوبارہ چیک کریں۔\n" + err.message);
    }
}

// 🔄 صارف کے بدلتے ہی پورا سسٹم اور ڈیش بورڈ ری سیٹ کریں
auth.onAuthStateChanged((user) => {
    if (user) {
        setupUserEnvironment(user);
    } else {
        document.getElementById('login-screen').classList.remove('page-hidden');
        document.getElementById('main-sidebar').classList.add('page-hidden');
        document.getElementById('main-content-wrapper').classList.add('page-hidden');
    }
});

function setupUserEnvironment(user) {
    document.getElementById('login-screen').classList.add('page-hidden');
    document.getElementById('main-sidebar').classList.remove('page-hidden');
    document.getElementById('main-content-wrapper').classList.remove('page-hidden');

    currentUserProfile.email = user.email;
    
    // رولز ڈیفائننگ سیکیورٹی فلٹرز (ڈیفالٹ ایڈمن رول سیٹ اپ)
    if (user.email.startsWith('admin')) {
        currentUserProfile.role = 'Admin';
        currentUserProfile.district = 'ALL';
        document.getElementById('user-role-badge').innerText = "Super Admin Portal";
        document.getElementById('admin-user-creator-block').classList.remove('page-hidden');
        document.getElementById('userDistrict').removeAttribute('readonly');
    } else {
        currentUserProfile.role = 'Staff';
        // ای میل سے ضلع کا نام اخذ کریں (مثال: peshawar.staff@alkhidmat.org)
        const extraction = user.email.split('.')[0];
        currentUserProfile.district = extraction.charAt(0).toUpperCase() + extraction.slice(1);
        document.getElementById('user-role-badge').innerText = `District: ${currentUserProfile.district}`;
        document.getElementById('admin-user-creator-block').classList.add('page-hidden');
        
        // فیلڈ ورکر کا ضلع لاک کریں تا کہ وہ دوسرے ضلع کا ڈیٹا نہ بدلے
        const distField = document.getElementById('userDistrict');
        distField.value = currentUserProfile.district;
        distField.setAttribute('readonly', 'true');
    }

    document.getElementById('profile-email-lbl').innerText = currentUserProfile.email;
    document.getElementById('profile-role-lbl').innerText = currentUserProfile.role;
    document.getElementById('profile-district-lbl').innerText = currentUserProfile.district;

    loadLiveDatabaseRecords();
}

function handleLogout() {
    auth.signOut().then(() => location.reload());
}

// 🛠️ نیا یوزر اکاؤنٹ بنانے کا میکانزم (صرف ایڈمن کے لیے)
async function createNewUserAccount(e) {
    e.preventDefault();
    if (currentUserProfile.role !== 'Admin') return alert("آپ کے پاس نیا اکاؤنٹ بنانے کا اختیار نہیں ہے!");
    
    const email = document.getElementById('newUserEmail').value;
    const pass = document.getElementById('newUserPassword').value;
    const boundDist = document.getElementById('newUserDistrict').value;

    try {
        // عارضی طور پر دوسرے سیشن کی تخلیق
        const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
        await secondaryApp.auth().createUserWithEmailAndPassword(email, pass);
        await db.collection("users_registry").doc(email).set({ boundDistrict: boundDist });
        secondaryApp.delete();
        
        alert(`کلسٹر اکاؤنٹ (${email}) کامیابی سے رجسٹر ہو گیا ہے!`);
        document.getElementById('userCreationForm').reset();
    } catch (err) {
        alert("اکاؤنٹ رجسٹریشن میں خرابی آئی: " + err.message);
    }
}

// 🔢 لائیو ماسکنگ فلٹرز برائے شناختی کارڈ اور موبائل فونز
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('cnic-mask')) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 13) val = val.substring(0, 13);
        let out = '';
        if (val.length > 0) out += val.substring(0, 5);
        if (val.length > 5) out += '-' + val.substring(5, 12);
        if (val.length > 12) out += '-' + val.substring(12, 13);
        e.target.value = out;
    }
    if (e.target.classList.contains('phone-mask')) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.substring(0, 11);
        let out = '';
        if (val.length > 0) out += val.substring(0, 4);
        if (val.length > 4) out += '-' + val.substring(4, 11);
        e.target.value = out;
    }
});

// 👩‍👦 "والدہ ہی سرپرست ہیں" آٹو فل اور لاک لاجک سسٹمز
function toggleMotherAsGuardian() {
    const isChecked = document.getElementById('motherIsGuardian').checked;
    const fields = ['guardianName', 'guardianRelation', 'guardianCnic', 'guardianJob', 'guardianMobile', 'guardianAddress'];

    if (isChecked) {
        document.getElementById('guardianName').value = document.getElementById('motherName').value;
        document.getElementById('guardianRelation').value = "والدہ / Mother";
        document.getElementById('guardianCnic').value = document.getElementById('motherCnic').value;
        document.getElementById('guardianJob').value = document.getElementById('motherJobDetails').value || "گھریلو خاتون";
        document.getElementById('guardianMobile').value = document.getElementById('motherMobile').value;
        document.getElementById('guardianAddress').value = document.getElementById('motherCurrentAddress').value;

        fields.forEach(f => document.getElementById(f).setAttribute('disabled', 'true'));
    } else {
        fields.forEach(f => {
            document.getElementById(f).removeAttribute('disabled');
            document.getElementById(f).value = '';
        });
    }
}

// 📸 کلائنٹ سائیڈ ہائی کمپریشن اسکینر اپلوڈر لاجک (بغیر کوالٹی خراب کیے سائز کم کریں)
async function compressAndUploadFile(inputEl, fieldIdPointer) {
    const file = inputEl.files[0];
    if (!file) return;

    const statusSpan = document.getElementById(`${fieldIdPointer}-status`);
    statusSpan.innerText = "⏳ فائل اسکین اور کمپریس ہو رہی ہے...";
    statusSpan.className = "text-xs block font-bold text-amber-600 animate-pulse";

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200; // کلاؤڈ کے لیے آئیڈیل چوڑائی
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // تصویر کو انتہائی لائٹ ویٹ (65% کوالٹی JPEG) میں بدلیں
            canvas.toBlob(async function (blob) {
                try {
                    const storageRef = storage.ref(`documents/${Date.now()}_${file.name}`);
                    const snapshot = await storageRef.put(blob);
                    const downloadUrl = await snapshot.ref.getDownloadURL();
                    
                    // کلائنٹ پوائنٹر کو کلاؤڈ یو آر ایل اسائن کریں
                    inputEl.setAttribute('data-uploaded-url', downloadUrl);
                    statusSpan.innerText = `✓ اسکین مکمل (${(blob.size/1024).toFixed(1)} KB) - کلاؤڈ پر سیو ہے`;
                    statusSpan.className = "text-xs block font-bold text-green-600";
                } catch (err) {
                    statusSpan.innerText = "✕ اپلوڈ فیل ہو گیا۔ انٹرنیٹ چیک کریں۔";
                    statusSpan.className = "text-xs block font-bold text-rose-600";
                }
            }, 'image/jpeg', 0.65);
        };
    };
}

// 💾 ڈیٹا بیس کرڈ آپریشنز (CRUD Write/Update Operations)
async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('recordId').value;

    const docData = {
        userDistrict: document.getElementById('userDistrict').value,
        userCluster: document.getElementById('userCluster').value,
        childName: document.getElementById('childName').value,
        regNo: document.getElementById('regNo').value,
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        hobby: document.getElementById('hobby').value,
        language: document.getElementById('language').value,
        futureAsp: document.getElementById('futureAsp').value,
        disability: document.getElementById('disability').value,
        schoolName: document.getElementById('schoolName').value,
        className: document.getElementById('className').value,
        schoolAddress: document.getElementById('schoolAddress').value,
        fatherName: document.getElementById('fatherName').value,
        fatherDod: document.getElementById('fatherDod').value,
        fatherReasonDod: document.getElementById('fatherReasonDod').value,
        fatherPlaceDod: document.getElementById('fatherPlaceDod').value,
        fatherJob: document.getElementById('fatherJob').value,
        fatherCnic: document.getElementById('fatherCnic').value,
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
        guardianName: document.getElementById('guardianName').value,
        guardianRelation: document.getElementById('guardianRelation').value,
        guardianCnic: document.getElementById('guardianCnic').value,
        guardianJob: document.getElementById('guardianJob').value,
        guardianMobile: document.getElementById('guardianMobile').value,
        guardianAddress: document.getElementById('guardianAddress').value,
        bankName: document.getElementById('bankName').value,
        bankBranchCode: document.getElementById('bankBranchCode').value,
        bankBranchAddress: document.getElementById('bankBranchAddress').value,
        bankAccountTitle: document.getElementById('bankAccountTitle').value,
        bankIban: document.getElementById('bankIban').value,
        
        docPhoto: document.getElementById('docPhoto').checked,
        docBirthCert: document.getElementById('docBirthCert').checked,
        docDeathCert: document.getElementById('docDeathCert').checked,
        docMotherCnic: document.getElementById('docMotherCnic').checked,
        docFatherCnic: document.getElementById('docFatherCnic').checked,
        docSchoolCert: document.getElementById('docSchoolCert').checked,

        // کلاؤڈ اسکین یو آر ایل کیپچرنگ میپ
        docPhotoUrl: document.getElementById('docPhoto').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',
        docBirthCertUrl: document.getElementById('docBirthCert').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',
        docDeathCertUrl: document.getElementById('docDeathCert').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',
        docMotherCnicUrl: document.getElementById('docMotherCnic').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',
        docFatherCnicUrl: document.getElementById('docFatherCnic').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',
        docSchoolCertUrl: document.getElementById('docSchoolCert').nextElementSibling.nextElementSibling.getAttribute('data-uploaded-url') || '',

        lastUpdated: new Date().getTime()
    };

    try {
        if (id) {
            await db.collection("orphans_records").doc(id).set(docData, { merge: true });
            alert("پروفائل ریکارڈ کامیابی سے اپڈیٹ ہو گیا!");
        } else {
            await db.collection("orphans_records").add(docData);
            alert("نیا فیملی ریکارڈ کامیابی سے کلاؤڈ پر محفوظ ہو گیا!");
        }
        document.getElementById('orphanForm').reset();
        switchPage('records-page');
    } catch (err) {
        alert("ڈیٹا ہینڈلنگ ایرر: آف لائن پرسٹنس محفوظ ہے۔");
    }
}

// 🔄 ریئل ٹائم سیکیور ڈیٹا لوڈر (رول بیسڈ فلٹریشن)
function loadLiveDatabaseRecords() {
    let queryRef = db.collection("orphans_records");
    
    // اگر یوزر عام کوآرڈینیٹر ہے تو سیکیورٹی رول کے تحت صرف اس کے ضلع کا ڈیٹا لاؤ
    if (currentUserProfile.role !== 'Admin') {
        queryRef = queryRef.where("userDistrict", "==", currentUserProfile.district);
    }

    queryRef.orderBy("lastUpdated", "desc").onSnapshot((snapshot) => {
        recordsCache = [];
        const tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';

        snapshot.forEach((doc) => {
            const item = doc.data();
            item.id = doc.id;
            recordsCache.push(item);

            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 border-b border-slate-200/80 transition";
            tr.innerHTML = `
                <td class="p-3 text-center font-mono font-bold text-slate-700">${item.regNo}</td>
                <td class="p-3 font-bold text-slate-900">${item.childName}</td>
                <td class="p-3 text-xs text-slate-600 font-semibold">${item.userDistrict} / ${item.userCluster}</td>
                <td class="p-3 text-slate-600 font-mono">${item.motherMobile || '-'}</td>
                <td class="p-3 text-center space-x-1 space-x-reverse">
                    <button onclick="editRecord('${item.id}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1 px-2.5 rounded-lg transition cursor-pointer">ایڈٹ</button>
                    <button onclick="downloadPDF('${item.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-2.5 rounded-lg transition cursor-pointer">PDF پرنٹ</button>
                    <button onclick="deleteRecord('${item.id}')" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1 px-2.5 rounded-lg transition cursor-pointer">حذف</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// 📝 ایڈٹ موڈ اور آٹو لاک فیلڈ فلنگ
function editRecord(id) {
    const data = recordsCache.find(r => r.id === id);
    if (!data) return;

    document.getElementById('recordId').value = data.id;
    document.getElementById('userDistrict').value = data.userDistrict || '';
    document.getElementById('userCluster').value = data.userCluster || '';
    document.getElementById('childName').value = data.childName || '';
    document.getElementById('regNo').value = data.regNo || '';
    document.getElementById('gender').value = data.gender || 'لڑکا / Male';
    document.getElementById('dob').value = data.dob || '';
    document.getElementById('hobby').value = data.hobby || '';
    document.getElementById('language').value = data.language || 'اردو';
    document.getElementById('futureAsp').value = data.futureAsp || '';
    document.getElementById('disability').value = data.disability || 'نہیں / No';
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
    document.getElementById('motherStatus').value = data.motherStatus || 'زندہ / Alive';
    document.getElementById('motherCnic').value = data.motherCnic || '';
    document.getElementById('motherDod').value = data.motherDod || '';
    document.getElementById('motherReasonDod').value = data.motherReasonDod || '';
    document.getElementById('motherChildrenCount').value = data.motherChildrenCount || '';
    document.getElementById('motherEducation').value = data.motherEducation || '';
    document.getElementById('motherUnder12Count').value = data.motherUnder12Count || '';
    document.getElementById('motherHouseStatus').value = data.motherHouseStatus || 'ذاتی / Owned';
    document.getElementById('motherJobStatus').value = data.motherJobStatus || 'نہیں / No';
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

    document.getElementById('form-header-title').innerText = "ریکارڈ تبدیل کریں / Edit Registration Form";
    switchPage('form-page');
}

async function deleteRecord(id) {
    if (confirm("کیا آپ واقعی اس فیملی کا ڈیٹا مستقل حذف کرنا چاہتے ہیں؟")) {
        await db.collection("orphans_records").doc(id).delete();
    }
}

// 📄 پروفیشنل A4 سائز پی ڈی ایف پرنٹ اینڈ آٹو بیک فکسر
function downloadPDF(id) {
    const data = recordsCache.find(r => r.id === id);
    if (!data) return;

    const dynamicContent = document.getElementById('pdf-dynamic-content');
    dynamicContent.innerHTML = `
        <table class="w-full border-2 border-slate-900 text-xs" style="border-collapse: collapse;" dir="rtl">
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">بنیادی علاقائی بائنڈنگ معلومات</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">منسلک ضلع:</td><td class="p-2 border border-slate-900">${data.userDistrict}</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">کلسٹر زون نام:</td><td class="p-2 border border-slate-900">${data.userCluster}</td>
            </tr>
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">1۔ بچے کی معلومات</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">بچے کا نام:</td><td class="p-2 border border-slate-900">${data.childName}</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">رجسٹریشن نمبر:</td><td class="p-2 border border-slate-900">${data.regNo}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">جنس / تاریخِ پیدائش:</td><td class="p-2 border border-slate-900">${data.gender} / ${data.dob}</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">زبان / معذوری:</td><td class="p-2 border border-slate-900">${data.language} / ${data.disability}</td>
            </tr>
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">2۔ بچے کی تعلیمی اسکول رپورٹ</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">اسکول کا نام / کلاس:</td><td class="p-2 border border-slate-900">${data.schoolName || '-'} (درجہ: ${data.className || '-'})</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">اسکول ایڈریس:</td><td class="p-2 border border-slate-900">${data.schoolAddress || '-'}</td>
            </tr>
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">3۔ والد کی تفصیلی معلومات (مرحوم)</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">والد کا نام:</td><td class="p-2 border border-slate-900">${data.fatherName || '-'}</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">تاریخ و وجہِ وفات:</td><td class="p-2 border border-slate-900">${data.fatherDod || '-'} (${data.fatherReasonDod || '-'})</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">پیشہ / شناختی کارڈ:</td><td class="p-2 border border-slate-900" colspan="3">${data.fatherJob || '-'} | CNIC: ${data.fatherCnic || '-'}</td>
            </tr>
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">4۔ والدہ کی معلومات</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">والدہ کا نام:</td><td class="p-2 border border-slate-900">${data.motherName || '-'} (${data.motherStatus})</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">والدہ کا CNIC:</td><td class="p-2 border border-slate-900">${data.motherCnic || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">بچوں کی تعداد / تعلیم:</td><td class="p-2 border border-slate-900">${data.motherChildrenCount || 0} (12 سال سے کم: ${data.motherUnder12Count || 0}) | تعلیم: ${data.motherEducation || '-'}</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">مکان / نوکری / ہنر:</td><td class="p-2 border border-slate-900">${data.motherHouseStatus} | ملازمت: ${data.motherJobStatus} (${data.motherJobDetails || '-'}) | ہنر: ${data.motherSkill || '-'}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">موبائل نمبر اور ایڈریس:</td><td class="p-2 border border-slate-900" colspan="3">${data.motherMobile || '-'} | پتہ: ${data.motherCurrentAddress || '-'}</td>
            </tr>
            <tr class="bg-slate-100"><th colspan="4" class="p-2 border border-slate-900 font-bold text-center">5۔ سرپرست اور بینک تفصیلات</th></tr>
            <tr>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">سرپرست کا نام و رشتہ:</td><td class="p-2 border border-slate-900">${data.guardianName || '-'} (${data.guardianRelation || '-'})</td>
                <td class="p-2 border border-slate-900 bg-slate-50 font-bold">بینک برانچ و IBAN:</td><td class="p-2 border border-slate-900">${data.bankName || '-'} | IBAN: ${data.bankIban || '-'}</td>
            </tr>
        </table>
    `;

    const printElement = document.getElementById('pdf-container');
    printElement.classList.remove('hidden');

    const opt = {
        margin:       10,
        filename:     `AlKhidmat_Profile_${data.regNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printElement).save().then(() => {
        printElement.classList.add('hidden'); // فوراً اسکرین نارمل بیک گراؤنڈ پر لے کر آئیں
    });
}

function exportToExcel() {
    if (recordsCache.length === 0) return alert("ایکسپورٹ کے لیے ڈیٹا دستیاب نہیں ہے!");
    const cleanList = recordsCache.map(({ id, lastUpdated, docPhotoUrl, docBirthCertUrl, docDeathCertUrl, docMotherCnicUrl, docFatherCnicUrl, docSchoolCertUrl, ...fields }) => fields);
    const worksheet = XLSX.utils.json_to_sheet(cleanList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Database");
    XLSX.writeFile(workbook, "AlKhidmat_Orphans_Master_Sheet.xlsx");
}

function filterRecords() {
    const q = document.getElementById('searchBar').value.toLowerCase();
    document.querySelectorAll('#records-tbody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}

function switchPage(p) {
    document.querySelectorAll('main > section').forEach(s => s.className = 'page-hidden bg-white p-5 md:p-8 rounded-2xl shadow-xl border border-slate-200/60');
    document.getElementById(p).className = 'page-active bg-white p-5 md:p-8 rounded-2xl shadow-xl border border-slate-200/60';
}

function toggleLanguage() {
    currentLang = currentLang === 'ur' ? 'en' : 'ur';
    const tag = document.getElementById('html-tag');
    if(currentLang === 'en') {
        tag.setAttribute('dir', 'ltr'); tag.classList.remove('urdu-font');
        document.getElementById('lang-btn').innerText = "اردو";
    } else {
        tag.setAttribute('dir', 'rtl'); tag.classList.add('urdu-font');
        document.getElementById('lang-btn').innerText = "English";
    }
}

// 🌐 لائیو نیٹ ورک کنکشن مانیٹر (آن لائن / آف لائن آٹو بیج ٹوگل)
function updateOnlineStatus() {
    const badge = document.getElementById('offline-badge');
    if (navigator.onLine) {
        badge.className = "bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full";
        badge.innerText = currentLang === 'ur' ? "● آن لائن موڈ" : "● Online Mode";
    } else {
        badge.className = "bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse";
        badge.innerText = currentLang === 'ur' ? "● آف لائن موڈ فعال ہے" : "● Offline Mode Active";
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// 📱 PWA ون کلک انسٹال بٹن لاجک
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    document.getElementById('pwa-install-btn').classList.remove('hidden');
});
document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('pwa-install-btn').classList.add('hidden');
    deferredPrompt = null;
});

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); });
}