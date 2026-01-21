'use client';

import type { SyndicationInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormSectionProps {
  register: UseFormRegister<SyndicationInputs>;
  errors: FieldErrors<SyndicationInputs>;
  watch?: UseFormWatch<SyndicationInputs>;
  setValue?: UseFormSetValue<SyndicationInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof SyndicationInputs;
  register: UseFormRegister<SyndicationInputs>;
  error?: { message?: string };
  prefix?: string;
  suffix?: string;
  step?: string;
  disabled?: boolean;
}

function FormField({
  label,
  name,
  register,
  error,
  prefix,
  suffix,
  step = '1',
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="space-y-2 group/field">
      <Label
        htmlFor={name}
        className={`text-sm font-medium transition-colors group-focus-within/field:text-primary ${
          disabled ? 'text-muted-foreground' : ''
        }`}
      >
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={name}
          type="number"
          step={step}
          disabled={disabled}
          {...register(name, { valueAsNumber: true })}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-14' : ''} tabular-nums ${
            disabled ? 'opacity-50' : ''
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
      {error?.message && (
        <p className="text-sm text-destructive animate-fade-in">{error.message}</p>
      )}
    </div>
  );
}

export function ProjectCapitalizationSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Project Capitalization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Purchase Price"
          name="purchasePrice"
          prefix="$"
          register={register}
          error={errors.purchasePrice}
        />
        <FormField
          label="Closing Costs"
          name="closingCosts"
          prefix="$"
          register={register}
          error={errors.closingCosts}
        />
        <FormField
          label="CapEx Reserves"
          name="capexReserves"
          prefix="$"
          register={register}
          error={errors.capexReserves}
        />
        <p className="text-xs text-muted-foreground">
          Total capitalization = Purchase Price + Closing Costs + CapEx Reserves + Loan Amount
        </p>
      </CardContent>
    </Card>
  );
}

interface EquityStructureSectionProps extends FormSectionProps {
  watch: UseFormWatch<SyndicationInputs>;
}

export function EquityStructureSection({ register, errors, watch }: EquityStructureSectionProps) {
  const lpPercent = watch('lpEquityPercent') || 0;
  const gpPercent = watch('gpEquityPercent') || 0;
  const totalPercent = lpPercent + gpPercent;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Equity Structure</CardTitle>
        <p className={`text-xs ${totalPercent === 100 ? 'text-success' : 'text-warning'}`}>
          Total equity split: {totalPercent}% {totalPercent !== 100 && '(should equal 100%)'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="LP Equity Contribution"
          name="lpEquityPercent"
          suffix="% of equity"
          step="1"
          register={register}
          error={errors.lpEquityPercent}
        />
        <FormField
          label="GP Equity Contribution"
          name="gpEquityPercent"
          suffix="% of equity"
          step="1"
          register={register}
          error={errors.gpEquityPercent}
        />
        <p className="text-xs text-muted-foreground">
          Limited Partners (LPs) are passive investors. General Partners (GPs) manage the deal and
          typically contribute 5-20% of equity.
        </p>
      </CardContent>
    </Card>
  );
}

interface DebtSectionProps extends FormSectionProps {
  watch: UseFormWatch<SyndicationInputs>;
  setValue: UseFormSetValue<SyndicationInputs>;
}

export function DebtSection({ register, errors, watch, setValue }: DebtSectionProps) {
  const interestOnly = watch('interestOnly');

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Debt Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Loan-to-Value (LTV)"
          name="loanToValue"
          suffix="%"
          step="1"
          register={register}
          error={errors.loanToValue}
        />
        <FormField
          label="Interest Rate"
          name="interestRate"
          suffix="%"
          step="0.125"
          register={register}
          error={errors.interestRate}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Loan Term"
            name="loanTermYears"
            suffix="years"
            register={register}
            error={errors.loanTermYears}
          />
          <FormField
            label="Amortization"
            name="amortizationYears"
            suffix="years"
            register={register}
            error={errors.amortizationYears}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="interestOnly" className="text-sm font-medium cursor-pointer">
            Interest-Only Period
          </Label>
          <Switch
            id="interestOnly"
            checked={interestOnly}
            onCheckedChange={(checked) => setValue('interestOnly', checked)}
          />
        </div>
        {interestOnly && (
          <FormField
            label="Interest-Only Years"
            name="interestOnlyYears"
            suffix="years"
            register={register}
            error={errors.interestOnlyYears}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function FeesSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">GP Fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Acquisition Fee"
          name="acquisitionFeePercent"
          suffix="% of price"
          step="0.25"
          register={register}
          error={errors.acquisitionFeePercent}
        />
        <FormField
          label="Asset Management Fee"
          name="assetManagementFeePercent"
          suffix="% annual"
          step="0.25"
          register={register}
          error={errors.assetManagementFeePercent}
        />
        <p className="text-xs text-muted-foreground">
          Acquisition fee: 1-3% at closing. Asset management: 1-2% of equity annually.
        </p>
      </CardContent>
    </Card>
  );
}

interface WaterfallSectionProps extends FormSectionProps {
  watch: UseFormWatch<SyndicationInputs>;
}

export function WaterfallSection({ register, errors, watch }: WaterfallSectionProps) {
  const tier1Lp = watch('tier1LpSplit') || 0;
  const tier1Gp = watch('tier1GpSplit') || 0;
  const tier2Lp = watch('tier2LpSplit') || 0;
  const tier2Gp = watch('tier2GpSplit') || 0;
  const tier3Lp = watch('tier3LpSplit') || 0;
  const tier3Gp = watch('tier3GpSplit') || 0;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Waterfall Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Return */}
        <FormField
          label="Preferred Return"
          name="preferredReturn"
          suffix="% annual"
          step="0.5"
          register={register}
          error={errors.preferredReturn}
        />
        <p className="text-xs text-muted-foreground">
          LPs receive preferred return before any profit splits. Typically 6-10%.
        </p>

        {/* Tier 1 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Tier 1: After Preferred Return</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="LP Split"
              name="tier1LpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier1LpSplit}
            />
            <FormField
              label="GP Split"
              name="tier1GpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier1GpSplit}
            />
          </div>
          <p
            className={`text-xs mt-1 ${tier1Lp + tier1Gp === 100 ? 'text-muted-foreground' : 'text-warning'}`}
          >
            Total: {tier1Lp + tier1Gp}% {tier1Lp + tier1Gp !== 100 && '(should equal 100%)'}
          </p>
        </div>

        {/* Tier 2 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Tier 2: After IRR Hurdle</h4>
          <FormField
            label="IRR Hurdle"
            name="tier2IrrHurdle"
            suffix="% IRR"
            step="1"
            register={register}
            error={errors.tier2IrrHurdle}
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              label="LP Split"
              name="tier2LpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier2LpSplit}
            />
            <FormField
              label="GP Split"
              name="tier2GpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier2GpSplit}
            />
          </div>
          <p
            className={`text-xs mt-1 ${tier2Lp + tier2Gp === 100 ? 'text-muted-foreground' : 'text-warning'}`}
          >
            Total: {tier2Lp + tier2Gp}% {tier2Lp + tier2Gp !== 100 && '(should equal 100%)'}
          </p>
        </div>

        {/* Tier 3 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Tier 3: After Higher IRR Hurdle</h4>
          <FormField
            label="IRR Hurdle"
            name="tier3IrrHurdle"
            suffix="% IRR"
            step="1"
            register={register}
            error={errors.tier3IrrHurdle}
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              label="LP Split"
              name="tier3LpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier3LpSplit}
            />
            <FormField
              label="GP Split"
              name="tier3GpSplit"
              suffix="%"
              step="5"
              register={register}
              error={errors.tier3GpSplit}
            />
          </div>
          <p
            className={`text-xs mt-1 ${tier3Lp + tier3Gp === 100 ? 'text-muted-foreground' : 'text-warning'}`}
          >
            Total: {tier3Lp + tier3Gp}% {tier3Lp + tier3Gp !== 100 && '(should equal 100%)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyOperationsSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Property Operations (Year 1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Gross Potential Rent (Annual)"
          name="grossPotentialRent"
          prefix="$"
          register={register}
          error={errors.grossPotentialRent}
        />
        <FormField
          label="Vacancy Rate"
          name="vacancyRate"
          suffix="%"
          step="0.5"
          register={register}
          error={errors.vacancyRate}
        />
        <FormField
          label="Other Income (Annual)"
          name="otherIncome"
          prefix="$"
          register={register}
          error={errors.otherIncome}
        />
        <FormField
          label="Operating Expense Ratio"
          name="operatingExpenseRatio"
          suffix="% of EGI"
          step="1"
          register={register}
          error={errors.operatingExpenseRatio}
        />
        <p className="text-xs text-muted-foreground">
          Typical expense ratios: 40-55% for multi-family properties.
        </p>
      </CardContent>
    </Card>
  );
}

export function GrowthAssumptionsSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Growth Assumptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Annual Rent Growth"
          name="rentGrowthRate"
          suffix="%"
          step="0.5"
          register={register}
          error={errors.rentGrowthRate}
        />
        <FormField
          label="Annual Expense Growth"
          name="expenseGrowthRate"
          suffix="%"
          step="0.5"
          register={register}
          error={errors.expenseGrowthRate}
        />
        <FormField
          label="Hold Period"
          name="holdPeriodYears"
          suffix="years"
          register={register}
          error={errors.holdPeriodYears}
        />
        <p className="text-xs text-muted-foreground">
          Typical syndication hold periods: 5-7 years. Rent growth: 2-4% in stable markets.
        </p>
      </CardContent>
    </Card>
  );
}

export function ExitAssumptionsSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Exit Assumptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Exit Cap Rate"
          name="exitCapRate"
          suffix="%"
          step="0.25"
          register={register}
          error={errors.exitCapRate}
        />
        <FormField
          label="Disposition Fee"
          name="dispositionFeePercent"
          suffix="% of sale"
          step="0.5"
          register={register}
          error={errors.dispositionFeePercent}
        />
        <p className="text-xs text-muted-foreground">
          Exit cap rate affects sale price significantly. Higher cap rate = lower sale price.
          Disposition fees typically 1-3%.
        </p>
      </CardContent>
    </Card>
  );
}
