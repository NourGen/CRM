#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BSA CRM — CUTOVER DAY SCRIPT (الانتقال النهائي من جوجل شيت للنظام الجديد)
#
# قبل التشغيل:
#   1. وقّف الشغل على جوجل شيت
#   2. نزّل تصدير أخير: File → Download → Microsoft Excel (.xlsx)
#   3. ارفعه إلى ~/crm/legacy/ باسم: جوجل شيت الرئيسي.xlsx
#   4. شغّل:  bash ~/crm/scripts/cutover.sh
#
# اللي بيعمله بالترتيب: نسخة أمان كاملة ← حفظ إعدادات النظام والفريش
# ← استيراد كامل من الإكسل ← استرجاع الإعدادات ← إصلاحات الأعمدة الناقصة
# ← إعادة صفوف الـ OC المكررة ← ضبط الصلاحيات ← إعادة تشغيل ← تقرير تحقق
# ═══════════════════════════════════════════════════════════════════
set -e
cd ~/crm
source ~/nodevenv/crm/24/bin/activate 2>/dev/null || true

DB_USER="bsa_crm_user"
DB_PASS='F6rZm2Q1SJ{bHwbz'
DB_NAME="bsa_CRM"
TS=$(date +%Y%m%d_%H%M%S)

echo "── [1/8] نسخة أمان كاملة قبل أي حاجة ──"
mkdir -p ~/db_backups
mysqldump -u "$DB_USER" -p"$DB_PASS" --single-transaction --default-character-set=utf8mb4 "$DB_NAME" > ~/db_backups/pre_cutover_$TS.sql
echo "    ✔ ~/db_backups/pre_cutover_$TS.sql ($(du -h ~/db_backups/pre_cutover_$TS.sql | cut -f1))"

echo "── [2/8] حفظ إعدادات النظام والفريش ليدز (الاستيراد بيمسحهم) ──"
mysqldump -u "$DB_USER" -p"$DB_PASS" --default-character-set=utf8mb4 "$DB_NAME" system_settings fresh_leads academy_unlocks > /tmp/preserve_$TS.sql 2>/dev/null || echo "    (جداول لسه مش موجودة — عادي أول مرة)"

echo "── [3/8] الاستيراد الكامل من الإكسل (بيمسح ويعيد البناء) ──"
npm run migrate 2>&1 | tail -5

echo "── [4/8] استرجاع الإعدادات والفريش ──"
if [ -s /tmp/preserve_$TS.sql ]; then
  mysql -u "$DB_USER" -p"$DB_PASS" --default-character-set=utf8mb4 "$DB_NAME" < /tmp/preserve_$TS.sql
  echo "    ✔ system_settings + fresh_leads + academy_unlocks رجعوا"
fi

echo "── [5/8] إصلاح الأعمدة غير المسماة (طلاب/محاضرين/محتوى) ──"
npx ts-node scripts/backfill-students.ts 2>&1 | tail -4

echo "── [6/8] إعادة صفوف العقود المكررة الـ OC ──"
npx ts-node scripts/backfill-payments.ts 2>&1 | tail -3

echo "── [7/8] ضبط صلاحيات المستخدمين ──"
mysql -u "$DB_USER" -p"$DB_PASS" --default-character-set=utf8mb4 "$DB_NAME" <<'SQL'
UPDATE users SET permissions='["dashboard","pull-fresh","pull-recycle","add-manual","log-call","search","followups","client-history","support-me","exception-requests","my-leads","waiting-list","tasks","invoice","payments","rounds","financial","payment-gateway","reports"]' WHERE role='Sales';
UPDATE users SET permissions='["dashboard","pull-fresh","pull-recycle","add-manual","log-call","search","followups","my-leads","waiting-list","tasks","payments","rounds","attendance","invoice","reports","financial","payment-gateway","admin-users","admin-leads","admin-settings","admin-log","academy-ledger","fresh-lead-manual","academy-mgmt"]' WHERE role='Manager';
SQL
echo "    ✔ الصلاحيات اتضبطت"

echo "── [8/8] إعادة تشغيل التطبيق ──"
/usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --user bsa --app-root /home/bsa/crm > /dev/null
sleep 6

echo ""
echo "═══════════ تقرير التحقق ═══════════"
mysql -u "$DB_USER" -p"$DB_PASS" --default-character-set=utf8mb4 "$DB_NAME" -N <<'SQL'
SELECT CONCAT('عملاء Raw_Data:      ', COUNT(*)) FROM raw_leads;
SELECT CONCAT('عملائي My_Leads:     ', COUNT(*)) FROM my_leads;
SELECT CONCAT('عقود نشطة:           ', COUNT(*)) FROM client_payments WHERE is_deleted=0;
SELECT CONCAT('طلاب الأكاديمية:     ', COUNT(*)) FROM academy_students;
SELECT CONCAT('طلاب ليهم محاضر:     ', COUNT(*)) FROM academy_students WHERE instructor_tag IS NOT NULL AND instructor_tag != '';
SELECT CONCAT('مستخدمين بصلاحيات:   ', COUNT(*)) FROM users WHERE permissions IS NOT NULL AND permissions != '[]';
SQL
echo "════════════════════════════════════"
echo "✅ التحويل خلص — من اللحظة دي الشغل كله على النظام الجديد، والشيت أرشيف للقراءة فقط."
