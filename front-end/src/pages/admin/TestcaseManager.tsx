import { Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/utils/i18n'

const mockTestcases = [
  { id: 'tc1', problem: 'Sum of Two Numbers', input: '1 2', output: '3', hidden: false },
  { id: 'tc2', problem: 'Sum of Two Numbers', input: '100 200', output: '300', hidden: false },
  { id: 'tc3', problem: 'Sum of Two Numbers', input: '-5 10', output: '5', hidden: true },
]

export default function TestcaseManager() {
  const { language } = useTranslation()

  return (
    <div className="space-y-8">
      <PageHeader 
        title={language === 'th' ? 'จัดการกรณีทดสอบ' : 'Testcase manager'} 
        description={
          language === 'th'
            ? 'ข้อมูลกรณีทดสอบแบบสาธารณะและแบบซ่อนตามรายโจทย์ปัญหา'
            : 'Public and hidden testcases per problem.'
        } 
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === 'th' ? 'กรณีทดสอบ' : 'Testcases'}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">{language === 'th' ? 'โจทย์ปัญหา' : 'Problem'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ข้อมูลนำเข้า' : 'Input'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ข้อมูลนำออก' : 'Output'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'สิทธิ์การมองเห็น' : 'Visibility'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTestcases.map((tc) => (
                <tr key={tc.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4">{tc.problem}</td>
                  <td className="px-6 py-4 font-mono text-xs">{tc.input}</td>
                  <td className="px-6 py-4 font-mono text-xs">{tc.output}</td>
                  <td className="px-6 py-4">
                    {tc.hidden ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" aria-hidden /> {language === 'th' ? 'ซ่อนไว้' : 'Hidden'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" aria-hidden /> {language === 'th' ? 'สาธารณะ' : 'Public'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Button variant="outline">{language === 'th' ? 'เพิ่มกรณีทดสอบ' : 'Add testcase'}</Button>
    </div>
  )
}
