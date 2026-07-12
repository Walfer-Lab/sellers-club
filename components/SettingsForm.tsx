'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserIcon,
  Wallet01Icon,
  File02Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import {
  updateSellerProfile,
  updateSellerPayment,
  deleteSellerAccount,
} from '@/app/actions/Settings'

type SellerProp = {
  id: string
  name?: string | null
  email?: string | null
  phone_no?: string | null
  upi_id?: string | null
}

export default function SettingsForm({
  seller,
  email,
}: {
  seller: SellerProp
  email: string
}) {
  const router = useRouter()

  // Profile Form State
  const [name, setName] = useState(seller?.name || '')
  const [phoneNo, setPhoneNo] = useState(seller?.phone_no || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Payment Form State
  const [upiId, setUpiId] = useState(seller?.upi_id || '')
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage(null)

    try {
      await updateSellerProfile({ name, phone_no: phoneNo })
      setProfileMessage({ type: 'success', text: 'Account information updated successfully.' })
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not update profile',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPayment(true)
    setPaymentMessage(null)

    try {
      await updateSellerPayment({ upi_id: upiId })
      setPaymentMessage({ type: 'success', text: 'UPI payment method saved successfully.' })
    } catch (err) {
      setPaymentMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save payment method',
      })
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete my account') return
    setDeletingAccount(true)
    setDeleteError(null)

    try {
      await deleteSellerAccount()
      router.push('/login')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.')
      setDeletingAccount(false)
    }
  }

  const canDelete = confirmText.trim().toLowerCase() === 'delete my account'

  return (
    <div className="space-y-8 pb-16">
      {/* 1. ACCOUNT INFORMATION */}
      <section className="bg-zinc-100 rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200">
          <div className="p-2 rounded-lg bg-white border border-zinc-200 text-blue-600">
            <HugeiconsIcon icon={UserIcon} size={20} />
          </div>
          <div>
            <h2 className="text-base font-general font-bold text-zinc-900">
              Account Information
            </h2>
            <p className="text-xs font-grotesk text-zinc-500">
              Update your personal name and contact number
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
              Account Email Address
            </label>
            <input
              type="email"
              disabled
              value={seller?.email || email || ''}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-zinc-200/60 text-sm font-general font-medium text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Your registered login email address is secure and read-only.
            </p>
          </div>

          <div>
            <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              disabled={savingProfile}
              className="w-full px-3.5 py-2.5 rounded-lg border-2 border-zinc-200 bg-white text-sm font-general font-medium text-zinc-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="+91 98765 43210"
              disabled={savingProfile}
              className="w-full px-3.5 py-2.5 rounded-lg border-2 border-zinc-200 bg-white text-sm font-general font-medium text-zinc-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {profileMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-general font-medium flex items-center gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              <HugeiconsIcon
                icon={profileMessage.type === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
                size={16}
              />
              {profileMessage.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white font-general font-medium text-xs hover:bg-zinc-800 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {savingProfile && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
              Save Account Info
            </button>
          </div>
        </form>
      </section>

      {/* 2. PAYMENT METHOD (UPI ID) */}
      <section className="bg-zinc-100 rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200">
          <div className="p-2 rounded-lg bg-white border border-zinc-200 text-emerald-600">
            <HugeiconsIcon icon={Wallet01Icon} size={20} />
          </div>
          <div>
            <h2 className="text-base font-general font-bold text-zinc-900">
              Payment Method & Payouts
            </h2>
            <p className="text-xs font-grotesk text-zinc-500">
              Configure your UPI ID to receive direct payouts from sales
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
              UPI ID (VPA)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okaxis or merchant@upi"
              disabled={savingPayment}
              className="w-full px-3.5 py-2.5 rounded-lg border-2 border-zinc-200 bg-white text-sm font-general font-medium text-zinc-900 outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Customer payments and store earnings will be routed directly to this UPI ID.
            </p>
          </div>

          {paymentMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-general font-medium flex items-center gap-2 ${
                paymentMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              <HugeiconsIcon
                icon={paymentMessage.type === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
                size={16}
              />
              {paymentMessage.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPayment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-general font-medium text-xs hover:bg-emerald-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {savingPayment && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
              Save UPI Payment Method
            </button>
          </div>
        </form>
      </section>

      {/* 4. DANGER ZONE: ACCOUNT DELETION */}
      <section className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-general font-bold text-red-700 flex items-center gap-2">
              <HugeiconsIcon icon={Delete02Icon} size={18} />
              Delete Seller Account
            </h2>
            <p className="text-xs font-grotesk text-red-600/80 mt-1 max-w-xl">
              Permanently delete your seller account, all digital products, storefront links, and recorded sales analytics. This action cannot be undone.
            </p>
          </div>

          {!showDeleteModal && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-xs font-general font-semibold hover:bg-red-700 transition-colors self-start sm:self-center cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          )}
        </div>

        {/* Inline Confirmation Box */}
        {showDeleteModal && (
          <div className="mt-6 pt-6 border-t border-red-200/80 max-w-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-general font-bold text-red-800 mb-2">
              Confirm Account Deletion
            </p>
            <p className="text-xs text-red-700 mb-3 font-grotesk">
              To proceed, please type <span className="font-bold select-all underline">&quot;delete my account&quot;</span> into the confirmation box below:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              disabled={deletingAccount}
              className="w-full px-3.5 py-2.5 rounded-lg border-2 border-red-300 bg-white text-sm font-general font-medium text-red-900 placeholder:text-red-300 outline-none focus:border-red-600 mb-3"
            />

            {deleteError && (
              <p className="text-xs font-general font-medium text-red-700 mb-3">{deleteError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || deletingAccount}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-red-600 text-white text-xs font-general font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deletingAccount && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
                Permanently Delete Account
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmText('')
                  setDeleteError(null)
                }}
                disabled={deletingAccount}
                className="px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-general font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
