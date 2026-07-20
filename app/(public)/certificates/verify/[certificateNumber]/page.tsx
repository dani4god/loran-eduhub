import { CheckCircle2, XCircle, ScrollText } from 'lucide-react'

async function getVerification(certificateNumber: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/certificates/verify/${certificateNumber}`,
    { cache: 'no-store' }
  )
  return res.json()
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>
}) {
  const { certificateNumber } = await params
  const result = await getVerification(certificateNumber)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ScrollText className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="font-bold text-gray-900 text-lg mb-1">Loran EduHub</h1>
        <p className="text-xs text-gray-400 mb-6">Certificate Verification</p>

        {result.valid ? (
          <>
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm mb-5">
              <CheckCircle2 size={18} /> Valid Certificate
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
              <p><span className="text-gray-400">Student:</span> <span className="font-semibold text-gray-900">{result.studentName}</span></p>
              <p><span className="text-gray-400">Course:</span> <span className="font-semibold text-gray-900">{result.courseName}</span></p>
              <p><span className="text-gray-400">Tutor:</span> <span className="font-semibold text-gray-900">{result.tutorName}</span></p>
              <p><span className="text-gray-400">Result:</span> <span className="font-semibold text-gray-900 capitalize">{result.classification} ({result.averageScore.toFixed(1)}%)</span></p>
              <p><span className="text-gray-400">Issued:</span> <span className="font-semibold text-gray-900">{new Date(result.issuedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
              <p className="pt-2 border-t border-gray-100 font-mono text-xs text-gray-400">{result.certificateNumber}</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-red-500">
            <XCircle size={32} />
            <p className="font-semibold text-sm">Certificate Not Found</p>
            <p className="text-xs text-gray-400">This certificate number could not be verified.</p>
          </div>
        )}
      </div>
    </div>
  )
}