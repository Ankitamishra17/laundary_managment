import { useState } from "react";
import { cancelSubscription } from "../../api/subscriptionApi";

export default function CancelSubscriptionModal({
  isOpen,
  subscription,
  onClose,
  onCancelled,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !subscription) return null;

  const handleCancel = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await cancelSubscription(subscription.id);
      onCancelled?.(
        data.subscription || { ...subscription, status: "Cancelled" },
      );
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-bg-dark/55 p-5 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center text-xl mx-auto mb-4">
          !
        </div>
        <h2 className="font-serif text-xl text-text-dark mb-2">
          Cancel Subscription
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-5">
          Cancel the subscription for{" "}
          <strong className="text-text-dark">
            {subscription.shop?.name || "this shop"}
          </strong>
          ? The shop will lose access once the current period ends.
        </p>

        {error && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-lg text-sm bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-card-border bg-card-tint text-text-dark font-semibold text-sm"
          >
            Keep Active
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}
