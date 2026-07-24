## HubSpot Company & Contact Property Map

This table documents the internal HubSpot property names, their data types, and provides a concise description of their purpose for use in API integrations and data modeling.

## Contact Properties 
| Field Type | Internal Name | Description / Notes |
| :--- | :--- | :--- |
| **URL** | `hs_linkedin_url` | Contact's main LinkedIn page URL. |
| **Single line text** | `seniority` | The contact's job seniority (e.g., Executive, Manager, Individual Contributor). |
| **Single line text** | `hs_object_source_detail_1` | Additional detail on the source of the object. |
| **Single checkbox** | `added_by_lead_engine` | Tracks if the object was created via a specific Lead Engine/Scraper tool. |
| **Single checkbox** | `estimator_completed` | Flag indicating if the user successfully finished the website project estimator. |
| **Single line text** | `tracking_id_uuid` | A unique tracking identifier for the user session/submission. |
| **Single line text** | `utm_source` | The source of the traffic (e.g., google, linkedin, direct). |
| **Single line text** | `utm_medium` | The marketing medium (e.g., cpc, email, social). |
| **Single line text** | `utm_campaign` | The name of the specific campaign. |
| **Single line text** | `utm_content` | Used to differentiate ads or links within the same campaign. |
| **Single line text** | `utm_term` | The keyword or search term that led to the conversion. |

## Company Properties (WORK IN PROGRESS)
| Field Type | Internal Name | Description / Notes |
| :--- | :--- | :--- |
| **Number** | `funding_amount` | The total funding amount raised by the company. |
| **Single line text** | `hs_employee_range` | Internal range/band of employee count (e.g., 1-10, 11-50). |
| **Single line text** | `hs_industry_group` | Classification of company industry. |