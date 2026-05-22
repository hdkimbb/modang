"use client";

import { ActionButton } from "@seed-design/react";

interface BottomFixedButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * 폼 하단 고정 CTA — 활성: brandSolid(캐럿), 비활성: gray-disabled (#D1D3D8)
 */
export function BottomFixedButton({
  label,
  onClick,
  disabled = false,
  loading = false,
}: BottomFixedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-seed-gray-200 bg-seed-gray-00"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="px-4 py-4">
        <ActionButton
          className="modang-action-btn"
          variant="brandSolid"
          size="large"
          onClick={onClick}
          disabled={isDisabled}
          style={{ width: "100%" }}
        >
          {label}
        </ActionButton>
      </div>
    </div>
  );
}
