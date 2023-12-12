// CS stands for Countryside Stewardship
export const transformOrganisationCSApplicationToBusinessApplications = data => {
  if (!data) {
    return []
  }

  if (data.length === 0) {
    return []
  }

  const result = []
  for (const response of data) {
    result.push(
      {
        applicationStatus: {
          id: response.application_id,
          open: response.application_code,
          status: response.status,
          type: response.application_type_de,
          sector: response.workflow_context_sub_code,
          year: response.year,
          frn: response.has_hefer_intersection_y,
          office: null
        },
        csClaim: {
          schemaYear: response.year,
          type: response.application_type_ds,
          status: response.status_sub_code,
          lastMovement: response.application_movement_date
        }
      })
  }

  return result
}
