"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateListingPlanOption } from "@/features/create-listing/types";

type Props = {
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionValue: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneCountryLabel: string;
  countryLabel: string;
  phoneCountry: string;
  phoneValue: string;
  phoneError: string | null;
  isActionBusy: boolean;
  showPlanSelector: boolean;
  planLabel: string;
  payPerListingLabel: string;
  subscriptionLabel: string;
  daysActiveLabel: string;
  monthlyUnlimitedLabel: string;
  plan: CreateListingPlanOption;
  onDescriptionChange: (value: string) => void;
  onPhoneCountryChange: (country: string) => void;
  onPhoneChange: (phone: string) => void;
  onPlanChange?: (plan: CreateListingPlanOption) => void;
};

export function CreateListingStepThree({
  descriptionLabel,
  descriptionPlaceholder,
  descriptionValue,
  phoneLabel,
  phonePlaceholder,
  phoneCountryLabel,
  countryLabel,
  phoneCountry,
  phoneValue,
  phoneError,
  isActionBusy,
  showPlanSelector,
  planLabel,
  payPerListingLabel,
  subscriptionLabel,
  daysActiveLabel,
  monthlyUnlimitedLabel,
  plan,
  onDescriptionChange,
  onPhoneCountryChange,
  onPhoneChange,
  onPlanChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {descriptionLabel}
          </span>
          <Textarea
            name="description"
            value={descriptionValue}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={descriptionPlaceholder}
            disabled={isActionBusy}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {descriptionValue.length} / 500
          </p>
        </label>
      </div>

      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {phoneLabel}
          </span>
          <div className="flex gap-2">
            <select
              value={phoneCountry}
              onChange={(e) => onPhoneCountryChange(e.target.value)}
              disabled={isActionBusy}
              className="h-12 w-24 rounded-full border border-border/55 bg-card px-3 text-sm"
            >
              <option value="MK">+389</option>
              <option value="RS">+381</option>
              <option value="AL">+355</option>
              <option value="GR">+30</option>
              <option value="TR">+90</option>
              <option value="DE">+49</option>
              <option value="GB">+44</option>
            </select>
            <Input
              name="phone"
              type="tel"
              value={phoneValue}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={phonePlaceholder}
              disabled={isActionBusy}
              className="h-12 flex-1"
            />
          </div>
          {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
        </label>
      </div>

      {showPlanSelector ? (
        <div>
          <label className="block space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {planLabel}
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onPlanChange?.("pay-per-listing")}
                className={`w-full rounded-[1.4rem] border p-4 text-left transition-colors ${
                  plan === "pay-per-listing"
                    ? "border-primary bg-primary/6"
                    : "border-border/50 bg-card/60 hover:border-border"
                }`}
                disabled={isActionBusy}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {payPerListingLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysActiveLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">€4</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onPlanChange?.("subscription")}
                className={`w-full rounded-[1.4rem] border p-4 text-left transition-colors ${
                  plan === "subscription"
                    ? "border-primary bg-primary/6"
                    : "border-border/50 bg-card/60 hover:border-border"
                }`}
                disabled={isActionBusy}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {subscriptionLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {monthlyUnlimitedLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">€30/mo</p>
                  </div>
                </div>
              </button>
            </div>
          </label>
        </div>
      ) : null}
    </div>
  );
}
