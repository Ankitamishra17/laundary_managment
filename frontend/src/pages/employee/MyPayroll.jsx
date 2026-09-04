import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Wallet, Download, Printer, Loader2, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getMyPayrolls, getMyPayrollById } from "../../api/payrollApi";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatINR(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function PayslipDetail({ payroll, onBack }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save("Payslip-" + (payroll.month) + "-" + payroll.year + ".pdf");
    } catch (err) {
      console.error("PDF download failed:", err);
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) { alert("Please allow popups to print."); return; }
    const shop = payroll.shop || {};
    const emp = payroll.employee || {};
    const html = "<!DOCTYPE html><html><head><title>Payslip</title><link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap' rel='stylesheet'><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;color:#0F2C2E;background:#fff;padding:32px}.container{max-width:700px;margin:0 auto}.header{background:linear-gradient(135deg,#05282A 0%,#028090 100%);padding:28px 36px;border-radius:16px 16px 0 0;color:#fff}.header h1{font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:4px}.header h2{font-size:26px;font-weight:700}.body{padding:28px 36px;border:1px solid #D8ECEA;border-top:none;border-radius:0 0 16px 16px}.row{display:flex;justify-content:space-between;padding:10px 0;font-size:14px;border-bottom:1px solid #EEF7F6}.row.total{border-top:2px solid #028090;border-bottom:none;font-weight:700;font-size:18px;padding-top:14px;margin-top:8px}.label{color:#5C7A78}.value{font-weight:600}.section{margin-top:20px;padding:16px;background:#EEF7F6;border-radius:12px}.section-title{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#5C7A78;font-weight:700;margin-bottom:12px}.footer{text-align:center;padding-top:20px;border-top:1px solid #D8ECEA;margin-top:24px}.footer p{font-size:11px;color:#5C7A78}@media print{body{padding:0}}</style></head><body><div class='container'><div class='header'><h1>" + (shop.name || "Laundry") + "</h1><h2>PAYSLIP</h2></div><div class='body'><div class='section'><div class='section-title'>Employee Details</div><div class='row'><span class='label'>Name</span><span class='value'>" + (emp.name || "-") + "</span></div><div class='row'><span class='label'>Designation</span><span class='value'>" + (emp.designation || "-") + "</span></div><div class='row'><span class='label'>Pay Period</span><span class='value'>" + MONTH_NAMES[payroll.month] + " " + payroll.year + "</span></div></div><div class='section' style='margin-top:16px'><div class='section-title'>Salary Calculation</div><div class='row'><span class='label'>Daily Rate</span><span class='value'>" + formatINR(payroll.perDaySalary || (payroll.basicSalary / payroll.totalDays)) + "</span></div><div class='row'><span class='label'>Paid Days</span><span class='value'>" + payroll.paidDays + " / " + payroll.totalDays + "</span></div><div class='row'><span class='label'>Unpaid Days</span><span class='value'>" + payroll.unpaidDays + "</span></div><div class='row'><span class='label'>Earned Salary</span><span class='value'>" + formatINR(payroll.earnedSalary) + "</span></div><div class='row'><span class='label'>Overtime</span><span class='value'>" + formatINR(payroll.overtimeAmount) + "</span></div><div class='row'><span class='label'>Allowances</span><span class='value'>" + formatINR(payroll.allowances) + "</span></div><div class='row'><span class='label'>Deductions</span><span class='value'>-" + formatINR(payroll.deductions) + "</span></div><div class='row total'><span class='label'>Net Salary</span><span class='value'>" + formatINR(payroll.netSalary) + "</span></div></div>" + (String(payroll.status).toUpperCase() === "PAID" ? "<div class='section' style='margin-top:16px'><div class='section-title'>Payment Details</div><div class='row'><span class='label'>Status</span><span class='value' style='color:#0B6E63'>PAID</span></div><div class='row'><span class='label'>Amount Paid</span><span class='value'>" + formatINR(payroll.paidAmount) + "</span></div></div>" : "") + "<div class='footer'><p>Thank you for your hard work! · " + (shop.name || "Laundry") + "</p></div></div></div><script>window.onload=function(){window.print();window.close()}</script></body></html>";
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!payroll) return null;

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium mb-4" style={{ color: colors.primaryTeal }}>
        <ArrowLeft size={14} /> Back to payroll
      </button>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:brightness-110 disabled:opacity-60" style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}>
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {downloading ? "Generating..." : "Download Payslip"}
        </button>
        <button onClick={handlePrint} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors" style={{ borderColor: colors.cardBorder, color: colors.primaryTeal, backgroundColor: colors.bgLight }}>
          <Printer size={15} /> Print
        </button>
      </div>

      <div ref={printRef} className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6" style={{ borderBottom: "3px solid " + colors.primaryTeal }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.bgDark }}>{payroll.shop?.name || "Shop"}</h2>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{payroll.shop?.address || ""}</p>
            </div>
            <div className="text-left sm:text-right">
              <h1 className="text-3xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.primaryTeal }}>PAYSLIP</h1>
              <p className="text-sm font-bold mt-1" style={{ color: colors.textDark }}>{MONTH_NAMES[payroll.month]} {payroll.year}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: String(payroll.status).toUpperCase() === "PAID" ? "#DFF7F1" : "#FBF0DC", color: String(payroll.status).toUpperCase() === "PAID" ? "#0B6E63" : "#9A6A12" }}>
                  {String(payroll.status).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div className="px-6 sm:px-8 py-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textMuted }}>Employee</h3>
            <p className="text-sm font-semibold" style={{ color: colors.textDark }}>{payroll.employee?.name || "-"}</p>
            {payroll.employee?.designation && <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{payroll.employee.designation}</p>}
            {payroll.employee?.email && <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{payroll.employee.email}</p>}
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textMuted }}>Pay Period</h3>
            <div className="space-y-1.5 text-xs" style={{ color: colors.textDark }}>
              <div className="flex justify-between"><span style={{ color: colors.textMuted }}>Month</span><span className="font-medium">{MONTH_NAMES[payroll.month]} {payroll.year}</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textMuted }}>Total Days</span><span className="font-medium">{payroll.totalDays}</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textMuted }}>Paid Days</span><span className="font-medium">{payroll.paidDays}</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textMuted }}>Unpaid Days</span><span className="font-medium">{payroll.unpaidDays}</span></div>
            </div>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="px-6 sm:px-8 pb-8">
          <div className="rounded-xl border p-5" style={{ borderColor: colors.cardBorder, backgroundColor: colors.primaryTeal + "05" }}>
            <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}><span>Daily Rate</span><span>{formatINR(payroll.perDaySalary || payroll.basicSalary / payroll.totalDays)}</span></div>
            <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}><span>Paid Days</span><span>{payroll.paidDays}</span></div>
            <div className="flex justify-between text-sm mb-2 font-medium" style={{ color: colors.textDark }}><span>Earned Salary</span><span>{formatINR(payroll.earnedSalary)}</span></div>
            {Number(payroll.overtimeAmount) > 0 && <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}><span>Overtime</span><span>{formatINR(payroll.overtimeAmount)}</span></div>}
            {Number(payroll.allowances) > 0 && <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}><span>Allowances</span><span>{formatINR(payroll.allowances)}</span></div>}
            {Number(payroll.deductions) > 0 && <div className="flex justify-between text-sm mb-2" style={{ color: "#B3261E" }}><span>Deductions</span><span>-{formatINR(payroll.deductions)}</span></div>}
            <div className="flex justify-between pt-3 mt-2 border-t-2" style={{ borderColor: colors.primaryTeal }}>
              <span className="text-lg font-bold" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>Net Salary</span>
              <span className="text-lg font-bold" style={{ color: colors.primaryTeal, fontFamily: "'Libre Baskerville', serif" }}>{formatINR(payroll.netSalary)}</span>
            </div>
            {String(payroll.status).toUpperCase() === "PAID" && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.cardBorder }}>
                <div className="flex justify-between text-xs" style={{ color: colors.textMuted }}><span>Status</span><span className="font-semibold" style={{ color: "#0B6E63" }}>PAID</span></div>
                {Number(payroll.paidAmount) > 0 && <div className="flex justify-between text-xs mt-1" style={{ color: colors.textMuted }}><span>Amount Paid</span><span>{formatINR(payroll.paidAmount)}</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 text-center" style={{ backgroundColor: colors.cardTint, borderTop: "1px solid " + colors.cardBorder }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Thank you for your hard work! · {payroll.shop?.name || "Laundry"}</p>
        </div>
      </div>
    </div>
  );
}

export default function MyPayroll() {
  const { id } = useParams();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMyPayrolls();
        if (res.success) setPayrolls(res.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load payroll.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (id) {
      setLoadingDetail(true);
      getMyPayrollById(id).then((res) => {
        if (res.success) setSelectedPayroll(res.data);
      }).catch(() => toast.error("Could not load payroll detail.")).finally(() => setLoadingDetail(false));
    }
  }, [id]);

  if (selectedPayroll || loadingDetail) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        {loadingDetail ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} /></div>
        ) : (
          <PayslipDetail payroll={selectedPayroll} onBack={() => setSelectedPayroll(null)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>My Payroll</h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>View your salary history and payslips.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} /></div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.mint}1F` }}><Wallet size={24} color={colors.mint} /></div>
          <p className="text-sm" style={{ color: colors.textMuted }}>No payroll records yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payrolls.map((p) => (
            <button key={p.id} onClick={() => setSelectedPayroll(p)} className="w-full text-left rounded-2xl border p-5 transition-all hover:shadow-md" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}15` }}>
                    <Wallet size={18} color={colors.primaryTeal} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: colors.textDark }}>{MONTH_NAMES[p.month]} {p.year}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Daily: {formatINR(p.perDaySalary || p.basicSalary / p.totalDays)} · {p.paidDays} days worked</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-14 sm:pl-0">
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: colors.primaryTeal }}>{formatINR(p.netSalary)}</div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: String(p.status).toUpperCase() === "PAID" ? "#DFF7F1" : "#FBF0DC", color: String(p.status).toUpperCase() === "PAID" ? "#0B6E63" : "#9A6A12" }}>
                    {String(p.status).toUpperCase()}
                  </span>
                  <Download size={16} style={{ color: colors.textMuted }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
