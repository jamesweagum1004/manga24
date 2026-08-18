"use client";

type Props = {
  message: string;
  children: React.ReactNode;
  className?: string;
};

export function ConfirmSubmitButton({ message, children, className }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
