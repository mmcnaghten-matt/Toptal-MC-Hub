import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/context/SurveyContext";
import { User, Building2, Mail, Briefcase, Users } from "lucide-react";

const UserInfoPage = () => {
  const { setUserInfo } = useSurvey();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", enterprise: "", department: "", role: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.enterprise.trim()) e.enterprise = "Company name is required";
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.role.trim()) e.role = "Job/Role is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setUserInfo(form);
    navigate("/survey/1");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Your Information</h1>
          <p className="text-muted-foreground text-sm mb-8">Please provide your details before starting the assessment.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {([
              { key: "name", label: "Full Name", placeholder: "John Smith", icon: User },
              { key: "enterprise", label: "Enterprise / Company", placeholder: "Acme Media Corp", icon: Building2 },
              { key: "department", label: "Department", placeholder: "Digital Strategy", icon: Users },
              { key: "role", label: "Job / Role", placeholder: "VP of Digital", icon: Briefcase },
              { key: "email", label: "Email Address", placeholder: "john@acme.com", icon: Mail },
            ] as const).map(({ key, label, placeholder, icon: Icon }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={key === "email" ? "email" : "text"}
                    value={form[key]}
                    onChange={(e) => { setForm(prev => ({ ...prev, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: "" })); }}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                {errors[key] && <p className="text-destructive text-sm mt-1">{errors[key]}</p>}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity mt-2"
            >
              Begin Assessment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPage;
