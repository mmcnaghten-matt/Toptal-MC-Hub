import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  job_title: z.string().min(2, 'Job title is required'),
  department: z.string().min(2, 'Department is required'),
  email: z.string().email('Valid email is required'),
});

export type DemographicsData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: DemographicsData) => void;
  isSubmitting?: boolean;
}

export default function DemographicsForm({ onSubmit, isSubmitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<DemographicsData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">About You</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          This helps us tailor your recommendations. Your information is kept confidential.
        </p>
      </div>

      {[
        { name: 'full_name' as const, label: 'Full Name', placeholder: 'Jane Smith' },
        { name: 'job_title' as const, label: 'Job Title', placeholder: 'VP of Technology' },
        { name: 'department' as const, label: 'Department', placeholder: 'Engineering' },
        { name: 'email' as const, label: 'Work Email', placeholder: 'jane@company.com' },
      ].map(({ name, label, placeholder }) => (
        <div key={name} className="space-y-1">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <input
            {...register(name)}
            type={name === 'email' ? 'email' : 'text'}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors[name] && (
            <p className="text-xs text-destructive">{errors[name]?.message}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Start Survey'}
      </button>
    </form>
  );
}
