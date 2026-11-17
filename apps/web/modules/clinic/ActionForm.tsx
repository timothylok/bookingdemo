import type { FormHTMLAttributes } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

/**
 * Next's app router accepts a Server Action as a form `action` at runtime, but the pinned
 * @types/react (18.0.26) only types it as a string. This is the single place that bridges the two,
 * so clinic forms stay fully typed everywhere else. Remove once @types/react is upgraded.
 */
export function ActionForm({
  action,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & { action: ServerAction }) {
  return <form {...rest} action={action as unknown as string} />;
}
