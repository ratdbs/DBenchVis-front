import { useContext, useEffect, useState } from 'react'
import QueryPlanView from './QueryPlanView'
import DurationCard from './DurationCard'
import { TpchContext } from '../../contexts/TpchContext'
import { Card } from '@material-tailwind/react'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

import { parseExpPostgreSQL, parseExpMySQL } from './parseExplain'

function ParseQueryPlan({ files }) {
  const { selectedQuery, durations } = useContext(TpchContext)
  const [queryPlans, setQueryPlans] = useState([])
  const [selectedCheckbox, setSelectedCheckbox] = useState('Both')

  const handleCheckboxChange = event => {
    const selectedValue = event.target.value
    setSelectedCheckbox(prevSelected =>
      prevSelected === selectedValue ? null : selectedValue
    )
  }

  useEffect(() => {
    const loadFiles = async () => {
      if (files && files.length > 0) {
        const planContents = []

        for (const file of files) {
          const fileContent = await readFile(file)

          // default: try PostgreSQL
          let plans = parseExpPostgreSQL(fileContent)
          // 실패 시 try MySQL
          if (plans.length === 0) plans = parseExpMySQL(fileContent)

          planContents.push(plans)
        }

        setQueryPlans(planContents)
      } else {
        // 업로드 한 파일 없는 경우
        setQueryPlans([])
      }
    }

    loadFiles()
  }, [files])

  const readFile = file => {
    return new Promise(resolve => {
      const fileReader = new FileReader()

      fileReader.onload = () => {
        resolve(fileReader.result)
      }

      // read the file as text
      fileReader.readAsText(file)
    })
  }

  return (
    <div>
      <h1 className="title">Query Plan</h1>
      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedCheckbox === 'PostgreSQL'}
              onChange={handleCheckboxChange}
              value="PostgreSQL"
            />
          }
          label="PostgreSQL"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedCheckbox === 'MySQL'}
              onChange={handleCheckboxChange}
              value="MySQL"
            />
          }
          label="MySQL"
        />
        <FormControlLabel
          control={
            <Checkbox
              defaultChecked
              checked={selectedCheckbox === 'Both'}
              onChange={handleCheckboxChange}
              value="Both"
            />
          }
          label="Both"
        />
      </div>
      <div className="plan-container">
        {queryPlans.map((plans, index) =>
          plans.length > 0 && plans[selectedQuery] ? (
            <div>
              {files[index] && files[index].name ? (
                <div className="filename-title">
                  <p>
                    {files[index].name.length > 80 / files.length
                      ? `${files[index].name.slice(0, 80 / files.length)}...`
                      : files[index].name}
                  </p>
                </div>
              ) : null}
              <Card key={index} className="plan-card">
                <DurationCard
                  duration={durations.find(
                    duration =>
                      duration.fileIndex === index &&
                      duration.queryNumber === (selectedQuery + 1).toString()
                  )}
                />
                <QueryPlanView
                  checkbox={selectedCheckbox}
                  key={index}
                  width={
                    (document.body.clientWidth * 0.45 - 10) / queryPlans.length
                  } // default padding 고려하여 -10
                  plan={plans[selectedQuery].Plan}
                />
              </Card>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

export default ParseQueryPlan
