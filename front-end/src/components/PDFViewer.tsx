import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PDFViewerProps {
  url: string
  title?: string
}

export default function PDFViewer({ url, title = 'Problem Statement' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageWidth, setPageWidth] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePageWidth = () => {
      const width = containerRef.current?.clientWidth ?? window.innerWidth
      setPageWidth(Math.max(280, Math.min(width - 32, 900)))
    }

    const observer = new ResizeObserver(updatePageWidth)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', updatePageWidth)
    updatePageWidth()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePageWidth)
    }
  }, [url])

  useEffect(() => {
    setCurrentPage(1)
    setNumPages(null)
    setLoading(true)
    setError(null)
  }, [url])

  useEffect(() => {
    if (!loading) return

    const timeout = window.setTimeout(() => {
      setLoading(false)
      setError('The PDF did not finish loading within 15 seconds.')
    }, 15000)

    return () => window.clearTimeout(timeout)
  }, [loading, url])

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    setError(error.message || 'Failed to load PDF')
    setLoading(false)
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    if (numPages) {
      setCurrentPage((prev) => Math.min(numPages, prev + 1))
    }
  }

  return (
    <Card className="flex h-full min-h-[500px] flex-col overflow-hidden border border-border bg-card shadow-sm w-full pdf-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 bg-muted/30 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">{title}</h3>
          {numPages && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Page {currentPage} of {numPages}
            </p>
          )}
        </div>
        <a
          href={url}
          download="problem-statement.pdf"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </a>
      </div>

      {/* PDF Container */}
      <div ref={containerRef} className="relative min-h-0 flex-1 w-full bg-background/50 flex items-center justify-center overflow-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading PDF...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-2 text-destructive p-4 max-w-xs">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center">{error}</span>
            <p className="text-xs text-muted-foreground text-center">
              The PDF could not be decoded. Use the direct link below to check whether the stored file itself is valid.
            </p>
            <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
              Open PDF directly
            </a>
          </div>
        )}

        {!error && (
          <div className="w-full flex flex-col items-center gap-4 p-4">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Loader2 className="h-6 w-6 animate-spin" />}
              error={<AlertCircle className="h-6 w-6 text-destructive" />}
            >
              {numPages &&
                Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    className={`mb-4 ${pageNum !== currentPage ? 'hidden' : ''}`}
                  >
                    <Page
                      pageNumber={pageNum}
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
            </Document>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {numPages && !error && (
        <div className="border-t border-border px-4 py-3 bg-muted/30 flex items-center justify-between gap-2">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const page = Math.min(numPages, Math.max(1, parseInt(e.target.value) || 1))
                setCurrentPage(page)
              }}
              className="w-12 px-2 py-1 border border-border rounded text-sm text-center bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">of {numPages}</span>
          </div>

          <Button
            onClick={goToNextPage}
            disabled={currentPage === numPages}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}
